import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { KnowledgeArticle, KnowledgeMatch } from '@shared/types'
import { embed } from './ollama.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const parseFrontmatter = (raw: string): KnowledgeArticle => {
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
const KB: KnowledgeArticle[] = readdirSync(KB_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => parseFrontmatter(readFileSync(join(KB_DIR, f), 'utf-8')))

type EmbeddedEntry = KnowledgeArticle & { embedding: number[] }

// populated once at startup via initKnowledge(); read-only after that — no per-request mutation
let kbStore: EmbeddedEntry[] = []

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
  console.log(`[knowledge] Embedding ${KB.length} KB entries...`)
  kbStore = await Promise.all( // embeds all KB entries concurrently
    KB.map(async (entry) => {
      const text = `${entry.title}\n\n${entry.content}`
      const embedding = await embed(text)
      return { ...entry, embedding }
    })
  )
  console.log(`[knowledge] Ready — ${kbStore.length} entries indexed`)
}

export const searchKnowledge = async (query: string, topN = 3): Promise<KnowledgeMatch[]> => {
  // guard catches requests that arrive before initKnowledge() completes on startup
  if (kbStore.length === 0) {
    throw new Error('Knowledge store not initialized — call initKnowledge() first')
  }
  const queryEmbedding = await embed(query)
  const scored = kbStore.map((entry) => ({
    kbMatchId: entry.id,
    score: parseFloat(cosineSimilarity(queryEmbedding, entry.embedding).toFixed(4)),
    snippet: entry.content.slice(0, 300).trimEnd() + '…'
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

export const getArticlesByIds = (ids: string[]): KnowledgeArticle[] =>
  ids.map((id) => KB.find((e) => e.id === id)).filter((e): e is KnowledgeArticle => e != null)
