import {
  CHANGELOG_CATEGORY_ID,
  createChangelogOctokit,
  fetchChangelogDiscussionByNumber,
} from '~/lib/changelog-github'
import { discussionDisplayDate } from '~/lib/changelog.utils'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const raw = req.query.number
  const numStr = Array.isArray(raw) ? raw[0] : raw
  const number = Number(numStr)
  if (!Number.isFinite(number)) {
    return res.status(400).json({ error: 'Invalid discussion number' })
  }

  try {
    const octokit = createChangelogOctokit()
    const discussion = await fetchChangelogDiscussionByNumber(
      octokit,
      'supabase',
      'supabase',
      number
    )

    if (!discussion || discussion.category?.id !== CHANGELOG_CATEGORY_ID) {
      return res.status(404).json({ error: 'Not found' })
    }

    const source = await mdxSerialize(discussion.body)
    const created_at = discussionDisplayDate({
      title: discussion.title,
      createdAt: discussion.createdAt,
    })
    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
    return res.status(200).json({
      title: discussion.title,
      url: discussion.url,
      created_at,
      source,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load discussion' })
  }
}
