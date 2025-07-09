export interface GitHubUser {
  company: string | null
  location: string | null
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`GitHub user ${username} not found`)
        return null
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error('Error fetching GitHub user data:', error)
    return null
  }
}
