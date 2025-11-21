import apiWrapper from 'lib/api/apiWrapper'
import { retrieveAnalyticsData } from 'lib/api/self-hosted/logs'
import { NextApiRequest, NextApiResponse } from 'next'
import assert from 'node:assert'

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

      const { data, error } = await retrieveAnalyticsData({
        name,
        params,
        projectRef: ref,
      })

      if (data) {
        return res.status(200).json(data)
      } else {
        return res.status(500).json({ error: { message: error.message } })
      }
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
