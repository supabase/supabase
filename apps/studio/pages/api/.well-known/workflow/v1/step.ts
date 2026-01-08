import type { NextApiRequest, NextApiResponse } from 'next'
import { POST as stepHandler } from '../../../../../lib/workflow/generated-step'

import '../../../../../workflows/register'
import { normalizeNextApiRequest, sendResponse } from '../../../../../lib/workflow/next-api-adapter'

export const config = { api: { bodyParser: false } }

export default async function step(req: NextApiRequest, res: NextApiResponse) {
  const request = normalizeNextApiRequest(req)
  const response = await stepHandler(request)
  await sendResponse(res, response)
}
