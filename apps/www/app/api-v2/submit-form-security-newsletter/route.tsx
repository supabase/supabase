import * as Sentry from '@sentry/nextjs'

import { CustomerioTrackClient } from '~/lib/customerio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { firstName, lastName, email } = body

  if (!firstName || !lastName || !email) {
    return new Response(JSON.stringify({ message: 'All fields are required' }), {
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
      firstName,
      lastName,
      'cio_subscription_preferences.topics.topic_2': true,
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
