import { waitUntil } from '@vercel/functions'
import { NextApiRequest, NextApiResponse } from 'next'
import { VERSION } from 'stripe-experiment-sync'
import { install, uninstall } from 'stripe-experiment-sync/supabase'
import { z } from 'zod'

const InstallBodySchema = z.object({
  projectRef: z.string().min(1),
  stripeSecretKey: z.string().min(1),
  startTime: z.number().positive().optional(),
})

const UninstallBodySchema = z.object({
  projectRef: z.string().min(1),
  startTime: z.number().positive().optional(),
})

async function isStripeSyncEnabled() {
  // The ConfigClient doesn't seem to work properly so we'll just gate access from the frontend
  // for now
  return true
}

function getBearerToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader || Array.isArray(authHeader)) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? null
}

export const config = {
  maxDuration: 300, // 5 minutes, since the installation process can take a while even if happening in background
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hide endpoint if the integration is disabled.
  if (!(await isStripeSyncEnabled())) {
    return res.status(404).json({ data: null, error: { message: 'Not Found' } })
  }

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
  const supabaseToken = getBearerToken(req)
  if (!supabaseToken) {
    return res
      .status(401)
      .json({ data: null, error: { message: 'Unauthorized: Invalid Authorization header' } })
  }

  const parsed = UninstallBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Invalid request body' } })
  }
  const { projectRef, startTime } = parsed.data

  waitUntil(
    uninstall({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
      supabaseManagementUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
      startTime,
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
  const supabaseToken = getBearerToken(req)
  if (!supabaseToken) {
    return res
      .status(401)
      .json({ data: null, error: { message: 'Unauthorized: Invalid Authorization header' } })
  }

  const parsed = InstallBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Invalid request body' } })
  }
  const { projectRef, stripeSecretKey, startTime } = parsed.data

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
        error: { message: errorMessage },
      })
    }
  } catch (error) {
    const normalizedErrorMessage = error instanceof Error ? error.message : String(error)

    return res.status(400).json({
      data: null,
      error: { message: `Failed to validate Stripe API key: ${normalizedErrorMessage}` },
    })
  }
  waitUntil(
    install({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      stripeKey: stripeSecretKey,
      baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
      supabaseManagementUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
      packageVersion: VERSION,
      startTime,
    }).catch((error) => {
      console.error('Stripe Sync Engine installation failed.', error)
      throw error
    })
  )

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync setup initiated', version: VERSION }, error: null })
}
