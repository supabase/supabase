import { NextApiRequest, NextApiResponse } from 'next'

type GitHubRepositoryRelease = {
  id: number
  url: string
  name: string
  tag_name: string
  published_at: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const fallback = { latest: null, published_at: null }
  try {
    const data: GitHubRepositoryRelease[] = await fetch(
      'https://api.github.com/repos/supabase/cli/releases?per_page=1'
    ).then((res) => res.json())

    if (data.length === 0) return res.status(200).json(fallback)

    return res.status(200).json({ latest: data[0].tag_name, published_at: data[0].published_at })
  } catch {
    return res.status(200).json(fallback)
  }
}

export default handler
