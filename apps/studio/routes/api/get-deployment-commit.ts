import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { createApiHandlers } from '@/lib/api/apiWrapper'

const commitSchema = z.object({
  committer: z.object({ date: z.string().datetime({ offset: true }) }),
})

async function getCommitTime(commitSha: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/supabase/supabase/git/commits/${commitSha}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'Supabase-Studio',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch commit details')
    }

    const data = commitSchema.parse(await response.json())
    return new Date(data.committer.date).toISOString()
  } catch (error) {
    console.error('Error fetching commit time:', error)
    return 'unknown'
  }
}

async function handleGet() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'development'
  const commitTime = commitSha !== 'development' ? await getCommitTime(commitSha) : 'unknown'

  // Valid metadata is identical for all visitors; failed lookups must remain retryable.
  const cacheControl =
    commitTime === 'unknown' ? 'private, no-store' : 'public, max-age=0, s-maxage=600'

  return Response.json(
    {
      commitSha,
      commitTime,
    },
    { headers: { 'Cache-Control': cacheControl } }
  )
}

export const Route = createFileRoute('/api/get-deployment-commit')({
  server: {
    handlers: createApiHandlers({ GET: handleGet }),
  },
})
