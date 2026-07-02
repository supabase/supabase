import { buildSystem, parseJson, toSuggestion } from '@/lib/ai/claude'
import { FEATURED_EXAMPLES, type FeaturedExample } from '@/lib/ai/examples'
import type { Suggestion } from '@/lib/ai/suggest'

/**
 * Self-hosted, open-source art-direction engine (brief §6.6) via Ollama.
 *
 * Same job as the Claude engine — reason over the icon/template/pattern
 * vocabulary + featured examples and return a structured recipe — but it runs
 * against a LOCAL Ollama server (Llama/Qwen/etc.), so nothing leaves your
 * infrastructure and there's no paid API. Opt-in: set OLLAMA_URL (and optionally
 * OLLAMA_MODEL) in .env.local. Reuses the exact prompt + validation as Claude,
 * so a small local model can't produce an off-menu recipe.
 */

const OLLAMA_URL = process.env.OLLAMA_URL
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1'

export function hasOllama(): boolean {
  return Boolean(OLLAMA_URL)
}

const SCHEMA_HINT =
  'Return ONLY a JSON object with keys: iconName (string or null), templateId (string), ' +
  'eyebrow (string), pattern (object with type/scale/color/opacity, or null), ' +
  'rationale (string), alternateIconNames (array of strings).'

export async function suggestWithOllama(
  description: string,
  examples: FeaturedExample[] = FEATURED_EXAMPLES
): Promise<Suggestion> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Fail fast rather than hang the request if the local server is down/slow.
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: 'json',
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: `${buildSystem(examples)}\n\n${SCHEMA_HINT}` },
        { role: 'user', content: `Blog post: ${description}` },
      ],
    }),
  })
  if (!res.ok) throw new Error(`ollama: HTTP ${res.status}`)
  const data = (await res.json()) as { message?: { content?: unknown } }
  const text = data.message?.content
  if (typeof text !== 'string') throw new Error('ollama: no message content')
  return toSuggestion(parseJson(text))
}
