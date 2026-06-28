import assert from 'node:assert'
import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { retrieveAnalyticsData } from '@/lib/api/self-hosted/logs'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

function formatLocalLogsUnavailableMessage(error: Error): string {
  const msg = error.message.toLowerCase()
  if (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout')
  ) {
    return 'Logs are unavailable: the analytics service could not be reached. Check that Logflare is running and accessible.'
  }
  return 'Logs are unavailable: the analytics service is not configured. Ensure PROJECT_ANALYTICS_URL and LOGFLARE_PRIVATE_ACCESS_TOKEN are set.'
}

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
        } else {
          if (name === 'logs.all') {
            return res
              .status(503)
              .json({ error: { message: formatLocalLogsUnavailableMessage(error) } })
          }
          return res.status(500).json({ error: { message: error.message } })
        }
      } catch (err) {
        if (name === 'logs.all' && err instanceof Error) {
          return res
            .status(503)
            .json({ error: { message: formatLocalLogsUnavailableMessage(err) } })
        }
        throw err
      }
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
