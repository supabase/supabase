import { NextApiRequest, NextApiResponse } from 'next'
// import { install } from 'stripe-experiment-sync/supabase'
import { install } from 'lib/api/integrations/stripe-sync.js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handleSetupStripeSync(req, res)
    default:
      return res
        .status(405)
        .json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleSetupStripeSync(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers['authorization']
  if (!authHeader || Array.isArray(authHeader)) {
    return res
      .status(401)
      .json({ data: null, error: { message: 'Unauthorized: Missing Supabase token' } })
  }
  const supabaseToken = authHeader.replace('Bearer ', '')
  const { projectRef, stripeSecretKey } = req.body

  if (!supabaseToken) {
    return res
      .status(401)
      .json({ data: null, error: { message: 'Unauthorized: Missing Supabase token' } })
  }

  if (!projectRef) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Missing projectRef in request body' } })
  }

  if (!stripeSecretKey) {
    return res.status(400).json({
      data: null,
      error: { message: 'Bad Request: Missing stripeSecretKey in request body' },
    })
  }
  try {
    await install({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      stripeKey: stripeSecretKey,
    })
  } catch (error: any) {
    console.error('Error during Stripe Sync installation:', error)
    return res.status(500).json({
      data: null,
      error: { message: `Internal Server Error: ${error.message || 'Installation failed'}` },
    })
  }

  return res.status(200).json({ data: { message: 'Stripe Sync setup initiated' }, error: null })
}
