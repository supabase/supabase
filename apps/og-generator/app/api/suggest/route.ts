import { hasClaude, suggestWithClaude } from '@/lib/ai/claude'
import { hasOllama, suggestWithOllama } from '@/lib/ai/ollama'
import { suggestArtDirection } from '@/lib/ai/suggest'
import { getFeaturedExamples } from '@/lib/supabase/featured-examples'

// Node runtime — the Anthropic SDK is not edge-compatible, and the API key must
// stay server-side (never shipped to the client).
export const runtime = 'nodejs'

/**
 * POST { description } → art-direction Suggestion (brief §6.6).
 *
 * Uses Claude when ANTHROPIC_API_KEY is configured; otherwise (or if the call
 * fails for any reason) falls back to the backend-free keyword matcher. The
 * response shape is identical, so the editor never breaks — the worst case is a
 * simpler suggestion, never an error.
 */
export async function POST(req: Request): Promise<Response> {
  let description = ''
  try {
    const body = (await req.json()) as { description?: unknown }
    description = typeof body.description === 'string' ? body.description.trim() : ''
  } catch {
    // ignore — treated as empty below
  }

  if (!description) {
    return Response.json(suggestArtDirection(''))
  }

  // DB-backed corpus when Supabase is configured; bundled seed otherwise.
  const examples = await getFeaturedExamples()

  // Engine order: Claude (paid API) → Ollama (self-hosted, free) → keyword.
  if (hasClaude()) {
    try {
      return Response.json(await suggestWithClaude(description, examples))
    } catch (err) {
      console.error('[api/suggest] Claude failed, trying next engine:', err)
    }
  }
  if (hasOllama()) {
    try {
      return Response.json(await suggestWithOllama(description, examples))
    } catch (err) {
      console.error('[api/suggest] Ollama failed, using keyword fallback:', err)
    }
  }

  // Always-available fallback so the button never breaks.
  return Response.json(suggestArtDirection(description, examples))
}
