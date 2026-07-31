import * as Sentry from '@sentry/nextjs'
import { CustomerioTrackClient } from '~/lib/customerio'
import { createRateLimiter } from '~/lib/rate-limit'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const isRateLimited = createRateLimiter({ max: 5, windowMs: 60 * 1000 })

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

export async function POST(req: Request) {
  if (isRateLimited(req)) {
    return new Response(JSON.stringify({ message: 'Too many requests. Try again later.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 429,
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON body' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const { email } = body

  if (!email) {
    return new Response(JSON.stringify({ message: 'Email is required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ message: 'Invalid email address' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  try {
    const customerioSiteId = process.env.CUSTOMERIO_SITE_ID
    const customerioApiKey = process.env.CUSTOMERIO_API_KEY

    if (!customerioSiteId || !customerioApiKey) {
      throw new Error('Customer.io credentials not configured')
    }

    const cio = new CustomerioTrackClient(customerioSiteId, customerioApiKey)

    await cio.createOrUpdateProfile(email, {
      'cio_subscription_preferences.topics.topic_1': true,
    })

    return new Response(JSON.stringify({ message: 'Subscription successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    Sentry.captureException(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
