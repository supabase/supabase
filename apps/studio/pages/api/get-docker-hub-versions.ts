import { NextApiRequest, NextApiResponse } from 'next'

type DockerRepositoryTagSearch = {
  count: number
  next: string | null
  previous: string | null
  results: {
    creator: number
    id: number
    images: any[]
    last_updated: string
    last_updater: number
    last_updater_username: string
    name: string
    repository: number
    full_size: number
    v2: boolean
    tag_status: string
    tag_last_pulled: string
    tag_last_pushed: string
    media_type: string
    content_type: string
    digest: string
  }[]
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const fallback = { latest: null }
  try {
    const data: DockerRepositoryTagSearch = await fetch(
      'https://hub.docker.com/v2/repositories/supabase/studio/tags?page=1&page_size=5'
    ).then((res) => res.json())
    const latest = data.results.find((x) => x.name === 'latest')
    const latestImage = data.results.find((x) => x.digest === latest?.digest && x.name !== 'latest')

    if (!latestImage) return res.status(200).json(fallback)
    return res.status(200).json({ latest: latestImage?.name })
  } catch {
    return res.status(200).json(fallback)
  }
}

export default handler
