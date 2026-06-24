import type { KnowledgeMatch } from '@shared/types'
import { ARTICLES } from '../data/articles.ts'
import { embed } from './ollama.ts'

type EmbeddedArticle = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  embedding: number[]
}

// populated once at startup via initKnowledge(); read-only after that — no per-request mutation
let articleStore: EmbeddedArticle[] = []

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
  console.log(`[knowledge] Embedding ${ARTICLES.length} articles...`)
  articleStore = await Promise.all( // embeds all articles concurrently
    ARTICLES.map(async (article) => {
      const text = `${article.title}\n\n${article.content}`
      const embedding = await embed(text)
      return { ...article, embedding }
    })
  )
  console.log(`[knowledge] Ready — ${articleStore.length} articles indexed`)
}

export const searchKnowledge = async (query: string, topN = 3): Promise<KnowledgeMatch[]> => {
  // guard catches requests that arrive before initKnowledge() completes on startup
  if (articleStore.length === 0) {
    throw new Error('Knowledge store not initialized — call initKnowledge() first')
  }
  const queryEmbedding = await embed(query)
  const scored = articleStore.map((article) => ({
    articleId: article.id,
    score: parseFloat(cosineSimilarity(queryEmbedding, article.embedding).toFixed(4)),
    snippet: article.content.slice(0, 300).trimEnd() + '…'
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}
