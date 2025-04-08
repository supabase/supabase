import { NextApiRequest, NextApiResponse } from 'next'

type GitHubRepositoryRelease = {
  id: number
  url: string
  name: string
  tag_name: string
  published_at: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // [Joshen] Added under supabase/turbo.json, but not sure why it's still warning
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const version = process.env.CURRENT_CLI_VERSION
  const fallback = { current: version, latest: null, published_at: null }
  try {
    const data: GitHubRepositoryRelease[] = await fetch(
      'https://api.github.com/repos/supabase/cli/releases?per_page=1'
    ).then((res) => res.json())

    if (data.length === 0) return res.status(200).json(fallback)

    return res
      .status(200)
      .json({ current: version, latest: data[0].tag_name, published_at: data[0].published_at })
  } catch {
    return res.status(200).json(fallback)
  }
}

export default handler
