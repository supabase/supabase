import * as Sentry from '@sentry/nextjs'

import { TroubleshootingModel } from '../troubleshooting/troubleshootingModel'

export const USE_KB_TROUBLESHOOTING_SEARCH = false

const KB_SEARCH_URL = process.env.KB_SEARCH_URL ?? 'https://supabase.com/kb/api/search'
const KB_TIMEOUT_MS = 3000

interface KbSearchResult {
  title: string
  href: string
  excerpt: string
}

async function fetchFullContent(href: string, fallback: string): Promise<string> {
  try {
    const response = await fetch(`${href}.md`, { signal: AbortSignal.timeout(KB_TIMEOUT_MS) })
    return response.ok ? await response.text() : fallback
  } catch {
    return fallback
  }
}

export async function searchKbTroubleshooting(
  query: string,
  limit: number,
  includeFullContent: boolean
): Promise<TroubleshootingModel[]> {
  try {
    const url = new URL(KB_SEARCH_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))
    const response = await fetch(url, { signal: AbortSignal.timeout(KB_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`KB search responded with ${response.status}`)

    const results: KbSearchResult[] = await response.json()
    return await Promise.all(
      results.map(
        async ({ title, href, excerpt }) =>
          new TroubleshootingModel({
            title,
            href,
            content: includeFullContent ? await fetchFullContent(href, excerpt) : undefined,
          })
      )
    )
  } catch (error) {
    console.error('Error searching KB troubleshooting:', error)
    Sentry.captureException(error)
    return []
  }
}

export function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length) out.push(b[i])
  }
  return out
}
