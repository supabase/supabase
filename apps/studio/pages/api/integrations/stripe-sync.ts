import { NextApiRequest, NextApiResponse } from 'next'
import { install, uninstall } from 'stripe-experiment-sync/supabase'
import { VERSION } from 'stripe-experiment-sync'
import { waitUntil } from '@vercel/functions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  switch (method) {
    case 'POST':
      return handleSetupStripeSyncInstall(req, res)
    case 'DELETE':
      return handleDeleteStripeSyncInstall(req, res)
    default:
      return res
        .status(405)
        .json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleDeleteStripeSyncInstall(req: NextApiRequest, res: NextApiResponse) {
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

  waitUntil(
    uninstall({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      stripeKey: stripeSecretKey,
    }).catch((error) => {
      console.error('Stripe Sync Engine uninstallation failed.', error)
      throw error
    })
  )

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync uninstallation initiated' }, error: null })
}

async function handleSetupStripeSyncInstall(req: NextApiRequest, res: NextApiResponse) {
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

  // Validate the Stripe API key before proceeding with installation
  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json()
      const errorMessage =
        errorData.error?.message || `Invalid Stripe API key (HTTP ${stripeResponse.status})`
      return res.status(400).json({
        data: null,
        error: { message: `Invalid Stripe API key: ${errorMessage}` },
      })
    }
  } catch (error: any) {
    return res.status(400).json({
      data: null,
      error: { message: `Failed to validate Stripe API key: ${error.message}` },
    })
  }

  waitUntil(
    install({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      stripeKey: stripeSecretKey,
      baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
      baseManagementApiUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
      packageVersion: VERSION,
    }).catch((error) => {
      console.error('Stripe Sync Engine installation failed.', error)
      throw error
    })
  )

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync setup initiated', version: VERSION }, error: null })
}
