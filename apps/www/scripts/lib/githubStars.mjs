import { readFile } from 'node:fs/promises'
import { Octokit } from '@octokit/core'

const isValidCount = (count) => Number.isSafeInteger(count) && count > 0

/** Preserve a successful count when GitHub is unavailable; null means unknown. */
export async function getGitHubStars(cachePath) {
  try {
    const octokit = new Octokit(process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {})
    const { data } = await octokit.request('GET /repos/{org}/{repo}', {
      org: 'supabase',
      repo: 'supabase',
      type: 'public',
    })
    if (!isValidCount(data?.stargazers_count)) {
      throw new Error('GitHub returned an invalid star count')
    }
    return data.stargazers_count
  } catch (error) {
    console.warn('Error fetching GitHub stars:', error.message)
  }

  try {
    const { githubStars } = JSON.parse(await readFile(cachePath, 'utf8'))
    if (isValidCount(githubStars)) return githubStars
  } catch {
    // A clean build may have no previously generated content.
  }

  return null
}
