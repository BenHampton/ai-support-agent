const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text' // swap here to change embedding model
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? 'qwen3:8b'           // swap here to change chat model

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const embed = async (text: string): Promise<number[]> => {
  const response = await fetch(`${OLLAMA_BASE}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text })
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ollama embed failed: ${response.status} — ${body}`)
  }
  const data = await response.json() as { embeddings: number[][] }
  return data.embeddings[0] // /api/embed takes a single input and returns a 1-element array
}

export const chat = async (
  messages: OllamaChatMessage[],
  onChunk: (token: string) => void
): Promise<void> => {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true, options: { num_ctx: 8192 } }) // 8192 = context window for qwen3:8b
  })
  if (!response.ok) {
    throw new Error(`Ollama chat failed: ${response.status} ${response.statusText}`)
  }

  // Ollama streams NDJSON — each line is a JSON object; buffer handles chunks split across TCP reads
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
        if (parsed.message?.content) {
          onChunk(parsed.message.content)
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}
