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

  // Read stripe key from Vault

  try {
    waitUntil(
      uninstall({
        supabaseAccessToken: supabaseToken,
        supabaseProjectRef: projectRef,
        stripeKey: stripeSecretKey,
      })
    )
  } catch (error: any) {
    console.error('Error during Stripe Sync uninstallation:', error)
    return res.status(500).json({
      data: null,
      error: { message: `Internal Server Error: ${error.message || 'Uninstallation failed'}` },
    })
  }

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
  try {
    waitUntil(
      install({
        supabaseAccessToken: supabaseToken,
        supabaseProjectRef: projectRef,
        stripeKey: stripeSecretKey,
        baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
        baseManagementApiUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
        packageVersion: VERSION,
      })
    )
  } catch (error: any) {
    console.error('Error during Stripe Sync installation:', error)
    return res.status(500).json({
      data: null,
      error: { message: `Internal Server Error: ${error.message || 'Installation failed'}` },
    })
  }

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync setup initiated', version: VERSION }, error: null })
}
