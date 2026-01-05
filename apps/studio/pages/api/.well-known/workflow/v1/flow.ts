import type { NextApiRequest, NextApiResponse } from 'next'
import { POST as workflowHandler } from '../../../../../lib/workflow/generated-flow'

import '../../../../../workflows/register'
import {
  apiRouteConfig,
  normalizeNextApiRequest,
  sendResponse,
} from '../../../../../lib/workflow/next-api-adapter'

export const config = { api: { bodyParser: false } }

export default async function flow(req: NextApiRequest, res: NextApiResponse) {
  const request = normalizeNextApiRequest(req)
  const response = await workflowHandler(request)
  await sendResponse(res, response)
}
