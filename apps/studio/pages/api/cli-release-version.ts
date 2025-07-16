import { NextApiRequest, NextApiResponse } from 'next'

type GitHubRepositoryRelease = {
  id: number
  url: string
  name: string
  tag_name: string
  published_at: string
}

const current = process.env.CURRENT_CLI_VERSION ? `v${process.env.CURRENT_CLI_VERSION}` : undefined

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { tag_name: latest, published_at }: GitHubRepositoryRelease = await fetch(
      'https://api.github.com/repos/supabase/cli/releases/latest'
    ).then((res) => res.json())

    const data: GitHubRepositoryRelease[] = await fetch(
      'https://api.github.com/repos/supabase/cli/releases?per_page=1'
    )
      .then((res) => res.json())
      // Ignore errors fetching beta release version
      .catch(() => [])
    const beta = data[0]?.tag_name

    return res.status(200).json({ current, latest, beta, published_at })
  } catch {
    return res.status(200).json({ current })
  }
}

export default handler
