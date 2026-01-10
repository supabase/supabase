import { NextApiRequest, NextApiResponse } from 'next'

async function getCommit(commitSha: string) {
  try {
    const response = await fetch(`https://github.com/supabase/supabase/commit/${commitSha}.json`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch deployment commit details')
    }

    const data = await response.json()
    return {
      time: new Date(data.payload.commit.committedDate).toISOString(),
      sha: data.payload.commit.oid as string,
    }
  } catch (error) {
    console.error('Error while fetching deployment commit details:', error)
    return { time: 'unknown', sha: 'unknown' }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    deploymentCommit: { time: string; sha: string }
    latestCommit: { time: string; sha: string }
  }>
) {
  // Set cache control headers for 10 minutes so that we don't get banned by GitHub API
  res.setHeader('Cache-Control', 's-maxage=600')

  // Get the build commit SHA from Vercel environment variable
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'development'

  // Only fetch commit time if we have a valid SHA
  const deploymentCommitPromise =
    commitSha !== 'development'
      ? getCommit(commitSha)
      : Promise.resolve({ time: 'unknown', sha: 'unknown' })
  const latestCommitPromise = getCommit('master')

  const [deploymentCommit, latestCommit] = await Promise.all([
    deploymentCommitPromise,
    latestCommitPromise,
  ])
  res.status(200).json({
    deploymentCommit,
    latestCommit,
  })
}
