import assert from 'node:assert'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { retrieveAnalyticsData } from '@/lib/api/self-hosted/logs'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
    case 'POST':
      const { name, ref, ...queryToForward } = req.query
      const params = req.method === 'GET' ? queryToForward : req.body

      assert(typeof ref === 'string', 'Invalid or missing ref parameter')
      assert(typeof name === 'string', 'Invalid or missing name parameter')

      try {
        const { data, error } = await retrieveAnalyticsData({
          name,
          params,
          projectRef: ref,
        })

        if (data) {
          return res.status(200).json(data)
        }

        if (error && shouldUseLocalLogsFallback(name, error)) {
          return res.status(200).json({
            result: [],
            error: { message: formatLocalLogsUnavailableMessage(error) },
          })
        }

        return res.status(500).json({ error: { message: error?.message ?? 'Unknown error' } })
      } catch (error) {
        if (shouldUseLocalLogsFallback(name, error)) {
          return res.status(200).json({
            result: [],
            error: { message: formatLocalLogsUnavailableMessage(error) },
          })
        }

        return res.status(500).json({
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

function shouldUseLocalLogsFallback(name: string, error: unknown) {
  if (name !== 'logs.all') return false

  const message = error instanceof Error ? error.message : ''
  if (!message) return false

  return [
    'PROJECT_ANALYTICS_URL is required',
    'LOGFLARE_PRIVATE_ACCESS_TOKEN is required',
    'fetch failed',
    'ECONNREFUSED',
  ].some((pattern) => message.includes(pattern))
}

function formatLocalLogsUnavailableMessage(error: unknown) {
  const reason = error instanceof Error ? ` Root cause: ${error.message}` : ''

  return (
    'Local analytics is unavailable. Enable analytics in supabase/config.toml with [analytics] enabled = true, then restart with `supabase stop && supabase start`.' +
    reason
  )
}
