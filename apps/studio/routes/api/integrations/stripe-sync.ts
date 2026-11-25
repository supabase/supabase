import { VERSION } from '@stripe/sync-engine'
import { install, uninstall } from '@stripe/sync-engine/supabase'
import { createFileRoute } from '@tanstack/react-router'
import { waitUntil } from '@vercel/functions'
import { z } from 'zod'

import { getBearerToken, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

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

async function handleDeleteStripeSyncInstall(request: Request): Promise<Response> {
  if (!(await isStripeSyncEnabled())) {
    return Response.json({ data: null, error: { message: 'Not Found' } }, { status: 404 })
  }

  const supabaseToken = getBearerToken(request.headers.get('authorization'))
  if (!supabaseToken) {
    return Response.json(
      { data: null, error: { message: 'Unauthorized: Invalid Authorization header' } },
      { status: 401 }
    )
  }

  const body = await parseJsonBody(request)
  const parsed = UninstallBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { message: 'Bad Request: Invalid request body' } },
      { status: 400 }
    )
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

  return Response.json(
    { data: { message: 'Stripe Sync uninstallation initiated' }, error: null },
    { status: 200 }
  )
}

async function handleSetupStripeSyncInstall(request: Request): Promise<Response> {
  if (!(await isStripeSyncEnabled())) {
    return Response.json({ data: null, error: { message: 'Not Found' } }, { status: 404 })
  }

  const supabaseToken = getBearerToken(request.headers.get('authorization'))
  if (!supabaseToken) {
    return Response.json(
      { data: null, error: { message: 'Unauthorized: Invalid Authorization header' } },
      { status: 401 }
    )
  }

  const body = await parseJsonBody(request)
  const parsed = InstallBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { message: 'Bad Request: Invalid request body' } },
      { status: 400 }
    )
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
      return Response.json(
        {
          data: null,
          error: { message: errorMessage },
        },
        { status: 400 }
      )
    }
  } catch (error) {
    const normalizedErrorMessage = error instanceof Error ? error.message : String(error)

    return Response.json(
      {
        data: null,
        error: { message: `Failed to validate Stripe API key: ${normalizedErrorMessage}` },
      },
      { status: 400 }
    )
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

  return Response.json(
    { data: { message: 'Stripe Sync setup initiated', version: VERSION }, error: null },
    { status: 200 }
  )
}

export const Route = createFileRoute('/api/integrations/stripe-sync')({
  server: {
    handlers: createApiHandlers({
      POST: ({ request }) => handleSetupStripeSyncInstall(request),
      DELETE: ({ request }) => handleDeleteStripeSyncInstall(request),
    }),
  },
})
