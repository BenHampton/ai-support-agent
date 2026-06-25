import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { KnowledgeArticle } from '@shared/types'

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

const dir = join(__dirname, 'knowledge')
export const ARTICLES: KnowledgeArticle[] = readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => parseFrontmatter(readFileSync(join(dir, f), 'utf-8')))
