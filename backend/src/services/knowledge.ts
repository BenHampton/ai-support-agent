import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { KnowledgeBaseChunk, KnowledgeBaseDoc, KnowledgeBaseMatch } from '@shared/types'
import { embed } from './ollama.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// chunking config — full docs are split into overlapping sub-document chunks so
// retrieval can match at section granularity and the prompt carries only the
// relevant slice, not the whole doc
const CHUNK_MAX_CHARS = 700
const CHUNK_OVERLAP_CHARS = 120
const MAX_KNOWLEDGE_RESULTS = 5

const parseFrontmatter = (raw: string): KnowledgeBaseDoc => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('Missing frontmatter')
  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    meta[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim()
  }
  return {
    id: meta['id'],
    title: meta['title'],
    category: meta['category'],
    tags: meta['tags'].split(',').map((t) => t.trim()),
    content: match[2].trim()
  }
}

const KB_DIR = join(__dirname, '../data/kb')
const KB: KnowledgeBaseDoc[] = readdirSync(KB_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => parseFrontmatter(readFileSync(join(KB_DIR, f), 'utf-8')))

// slugify a section heading so chunk ids stay readable, e.g. 'return-policy-us#refunds'
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// breaks an oversized section into overlapping windows; prefers a whitespace
// boundary near the limit so chunks don't cut mid-word
const windowSplit = (text: string): string[] => {
  const windows: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + CHUNK_MAX_CHARS, text.length)
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end)
      if (boundary > start) end = boundary
    }
    windows.push(text.slice(start, end).trim())
    if (end >= text.length) break
    start = end - CHUNK_OVERLAP_CHARS
  }
  return windows.filter((w) => w.length > 0)
}

// hybrid chunking: split on `##` headings into sections, then window-split any
// section that exceeds CHUNK_MAX_CHARS. Uses the KB's clean structure when
// present, stays robust to long or unstructured sections.
const chunkKbDoc = (doc: KnowledgeBaseDoc): KnowledgeBaseChunk[] => {
  const sections = doc.content
    .split(/^##\s+/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const chunks: KnowledgeBaseChunk[] = []
  sections.forEach((section, sectionIdx) => {
    const heading = section.split('\n', 1)[0]
    const baseSlug = slugify(heading) || `section-${sectionIdx}`
    const pieces = section.length > CHUNK_MAX_CHARS ? windowSplit(section) : [section]
    pieces.forEach((content, pieceIdx) => {
      const suffix = pieces.length > 1 ? `${baseSlug}-${pieceIdx}` : baseSlug
      chunks.push({ chunkId: `${doc.id}#${suffix}`, kbId: doc.id, title: doc.title, content })
    })
  })

  return chunks
}

type EmbeddedChunk = KnowledgeBaseChunk & { embedding: number[] }

// populated once at startup via initKnowledge(); read-only after that — no per-request mutation
let kbStore: EmbeddedChunk[] = []

// measures the angle between two vectors; 1.0 = identical direction, 0 = orthogonal
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export const initKnowledge = async (): Promise<void> => {
  const chunks = KB.flatMap(chunkKbDoc)
  console.log(`[knowledge] Embedding ${chunks.length} chunks from ${KB.length} KB docs...`)
  kbStore = await Promise.all( // embeds all chunks concurrently
    chunks.map(async (chunk) => {
      const text = `${chunk.title}\n\n${chunk.content}`
      const embedding = await embed(text)
      return { ...chunk, embedding }
    })
  )
  console.log(`[knowledge] Ready — ${kbStore.length} chunks indexed`)
}

export const searchKnowledge = async (
  query: string,
  topN = MAX_KNOWLEDGE_RESULTS
): Promise<KnowledgeBaseMatch[]> => {
  // guard catches requests that arrive before initKnowledge() completes on startup
  if (kbStore.length === 0) {
    throw new Error('Knowledge store not initialized — call initKnowledge() first')
  }
  const queryEmbedding = await embed(query)
  const scored = kbStore.map((chunk) => ({
    kbMatchId: chunk.chunkId,
    kbId: chunk.kbId,
    score: parseFloat(cosineSimilarity(queryEmbedding, chunk.embedding).toFixed(4)),
    snippet: chunk.content.slice(0, 300).trimEnd() + '…'
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

export const getChunksByIds = (ids: string[]): KnowledgeBaseChunk[] =>
  ids
    .map((id) => kbStore.find((c) => c.chunkId === id))
    .filter((c): c is EmbeddedChunk => c != null)
    .map(({ embedding: _embedding, ...chunk }) => chunk)
