import { hasClaude, suggestWithClaude } from '@/lib/ai/claude'
import { suggestArtDirection } from '@/lib/ai/suggest'

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

  if (hasClaude()) {
    try {
      const suggestion = await suggestWithClaude(description)
      return Response.json(suggestion)
    } catch (err) {
      // Fall through to the keyword matcher so the button always works.
      console.error('[api/suggest] Claude suggestion failed, using keyword fallback:', err)
    }
  }

  return Response.json(suggestArtDirection(description))
}
