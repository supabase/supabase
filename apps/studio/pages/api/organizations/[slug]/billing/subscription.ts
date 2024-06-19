import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { extractResponse } from 'pages/api/constants'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type ResponseData = extractResponse<'/platform/organizations/{slug}/billing/subscription', 'get'>

const handleGet = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const response: ResponseData = {
    billing_cycle_anchor: 0,
    current_period_end: 0,
    current_period_start: 0,
    next_invoice_at: 0,
    usage_billing_enabled: false,
    plan: {
      id: 'enterprise',
      name: 'Enterprise',
    },
    addons: [],
    project_addons: [],
    payment_method_type: '',
    billing_via_partner: false,
    billing_partner: 'fly',
    scheduled_plan_change: null,
    customer_balance: 0,
    nano_enabled: false,
  }

  return res.status(200).json(response)
}
