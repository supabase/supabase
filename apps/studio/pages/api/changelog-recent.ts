import type { NextApiRequest, NextApiResponse } from 'next'

import { getRecentChangelogDiscussions } from '@/lib/changelog-recent-github'

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600'

type ResponseBody = {
  items: { title: string; url: string }[]
  /** Present in development when the GitHub call fails, to debug local env. */
  _devError?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  try {
    const items = await getRecentChangelogDiscussions(2)
    res.setHeader('Cache-Control', CACHE_CONTROL)
    const body: ResponseBody = { items }
    if (process.env.NODE_ENV === 'development' && items.length === 0) {
      const hasEnv = Boolean(
        process.env.GITHUB_CHANGELOG_APP_ID?.trim() &&
          process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID?.trim() &&
          process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY?.trim()
      )
      if (hasEnv) {
        body._devError =
          'GitHub returned no changelog items. Check app installation on supabase/supabase, PEM newlines (use \\n in .env), and server logs for GraphQL errors.'
      } else {
        body._devError =
          'Missing GITHUB_CHANGELOG_APP_ID / GITHUB_CHANGELOG_APP_INSTALLATION_ID / GITHUB_CHANGELOG_APP_PRIVATE_KEY on the server (restart next dev after editing .env.local).'
      }
    }
    return res.status(200).json(body)
  } catch (error) {
    console.error('changelog-recent:', error)
    res.setHeader('Cache-Control', 'no-store')
    const message = error instanceof Error ? error.message : String(error)
    return res.status(200).json({
      items: [],
      ...(process.env.NODE_ENV === 'development' && { _devError: message }),
    })
  }
}
