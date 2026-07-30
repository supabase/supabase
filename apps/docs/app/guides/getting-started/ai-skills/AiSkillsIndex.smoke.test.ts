// Guards against the docs GitHub App losing access to supabase/agent-skills,
// which 404s silently and renders an empty table.
import { load } from 'cheerio'
import { describe, expect, it } from 'vitest'

// Override to target a preview deploy or localhost; defaults to production.
const DOCS_BASE_URL = process.env.DOCS_SMOKE_URL ?? 'https://supabase.com'
const AI_SKILLS_URL = `${DOCS_BASE_URL.replace(/\/$/, '')}/docs/guides/ai-tools/ai-skills`

describe('prod smoke test: agent skills load on the AI Skills page', () => {
  it('renders the skills table with at least one skill and no fallback', async () => {
    const result = await fetch(AI_SKILLS_URL, { signal: AbortSignal.timeout(30_000) })
    expect(result.status).toBe(200)

    const html = await result.text()
    expect(html).not.toContain('Unable to load AI skills at the moment.')

    // The install command only appears on real skill rows.
    const $ = load(html)
    const installCommands = $('code')
      .map(function () {
        return $(this).text()
      })
      .get()
      .filter((text) => text.startsWith('npx skills add supabase/agent-skills --skill '))

    expect(installCommands.length).toBeGreaterThan(0)
    // Test timeout must outlive the fetch abort so the network error surfaces
    // instead of a generic vitest timeout.
  }, 45_000)
})
