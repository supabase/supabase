import * as Sentry from '@sentry/nextjs'

import { CustomerioAppClient, CustomerioTrackClient } from '~/lib/customerio'
import { insertPageInDatabase } from '~/lib/notion'

import {
  SupaSquadApplication,
  supaSquadApplicationSchema,
} from '~/data/open-source/contributing/supasquad.utils'

// Using a separate Sentry client for community following this guide:
// https://docs.sentry.io/platforms/javascript/best-practices/multiple-sentry-instances/
const integrations = Sentry.getDefaultIntegrations({}).filter((defaultIntegration) => {
  return !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(defaultIntegration.name)
})

const sentryCommunityClient = new Sentry.NodeClient({
  dsn: process.env.SENTRY_DSN_COMMUNITY,
  transport: Sentry.makeNodeTransport,
  stackParser: Sentry.defaultStackParser,
  integrations: [...integrations],
})

const sentryCommunity = new Sentry.Scope()
sentryCommunity.setClient(sentryCommunityClient)

const captureSentryCommunityException = (error: any) => {
  if (process.env.SENTRY_DSN_COMMUNITY) {
    sentryCommunity.captureException(error)
  }
}

const NOTION_API_KEY = process.env.NOTION_SUPASQUAD_API_KEY
const NOTION_DB_ID = process.env.NOTION_SUPASQUAD_APPLICATIONS_DB_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

function truncateRichText(s: string, max = 1900) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max) + '…' : s
}

function asMultiSelect(values: string[]) {
  return values.map((v) => ({ name: v }))
}

function normalizeTrack(t: { heading: string; description: string } | string) {
  // Handle both old string format and new object format
  const trackName = typeof t === 'string' ? t : t.heading
  if (trackName === 'Builder/Maintainer') return 'Builder / Maintainer'
  return trackName
}

export async function POST(req: Request) {
  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    captureSentryCommunityException(new Error('Server misconfigured: missing Notion credentials'))
    return new Response(
      JSON.stringify({ message: 'Server misconfigured: missing Notion credentials' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (error: any) {
    captureSentryCommunityException(new Error('Unable to parse JSON:`'))
    return new Response(JSON.stringify({ message: 'Invalid JSON' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  const parsed = supaSquadApplicationSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ message: parsed.error.flatten() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  const data = parsed.data

  try {
    const notionProps = getNotionPageProps(data)
    const notionPageId = await insertPageInDatabase(NOTION_DB_ID, NOTION_API_KEY, notionProps)

    await savePersonAndEventInCustomerIO({
      ...data,
      tracks: data.tracks.map(normalizeTrack),
      notion_page_id: notionPageId,
      source_url: req.headers.get('origin'),
    })

    return new Response(JSON.stringify({ message: 'Submission successful', id: notionPageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (err: any) {
    console.error(err)
    captureSentryCommunityException(err)
    return new Response(
      JSON.stringify({ message: 'Error sending your application', error: err?.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      }
    )
  }
}

const savePersonAndEventInCustomerIO = async (data: any) => {
  const customerioSiteId = process.env.CUSTOMERIO_SITE_ID
  const customerioApiKey = process.env.CUSTOMERIO_API_KEY

  if (customerioSiteId && customerioApiKey) {
    try {
      const customerioClient = new CustomerioTrackClient(customerioSiteId, customerioApiKey)

      // Create or update profile in Customer.io
      // Note: only include personal information
      // not application specific responses
      await customerioClient.createOrUpdateProfile(data.email, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        city: data.city,
        country: data.country,
        github: data.github,
        twitter: data.twitter,
        discord: data.discord,
      })

      // Track the supasquad_application_form_submitted event
      // This includes application specific responses
      const customerioEvent = {
        userId: data.email,
        type: 'track' as const,
        event: 'supasquad_application_form_submitted',
        properties: {
          ...data,
          event_type: 'supasquad_application_form_submitted',
          source: 'supasquad_application_form',
          submitted_at: new Date().toISOString(),
        },
        timestamp: customerioClient.isoToUnixTimestamp(new Date().toISOString()),
      }

      await customerioClient.trackEvent(data.email, customerioEvent)

      await sendConfirmationEmail({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      })
    } catch (error) {
      console.error('Customer.io Track API integration failed:', error)
    }
  }
}

const sendConfirmationEmail = async (emailData: {
  email: string
  first_name: string
  last_name: string
}) => {
  const customerioApiKey = process.env.CUSTOMERIO_APP_API_KEY

  if (customerioApiKey) {
    const customerioAppClient = new CustomerioAppClient(customerioApiKey)

    try {
      const emailRequest = {
        transactional_message_id: 9,
        to: emailData.email,
        identifiers: {
          email: emailData.email,
        },
        message_data: {
          first_name: emailData.first_name,
          last_name: emailData.last_name,
        },
        send_at: customerioAppClient.isoToUnixTimestamp(
          new Date(Date.now() + 60 * 1000).toISOString()
        ), // Schedule to send after 1 minute
      }

      await customerioAppClient.sendTransactionalEmail(emailRequest)
    } catch (error) {
      throw new Error(`Failed to send confirmation email: ${error}`)
    }
  } else {
    console.warn('Customer.io App API key is not set')
  }
}

const getNotionPageProps = (data: SupaSquadApplication) => {
  const fullName =
    `${data.first_name?.trim() || ''} ${data.last_name?.trim() || ''}`.trim() || 'Unnamed'

  const props: Record<string, any> = {
    Name: {
      title: [{ type: 'text', text: { content: fullName } }],
    },
    'First name': {
      rich_text: [{ type: 'text', text: { content: data.first_name || '' } }],
    },
    'Last name': {
      rich_text: [{ type: 'text', text: { content: data.last_name || '' } }],
    },
    Email: { email: data.email },
    'What track would you like to be considered for?': {
      multi_select: asMultiSelect(data.tracks.map(normalizeTrack)),
    },
    'Product areas of interest': {
      multi_select: asMultiSelect(data.areas_of_interest),
    },
    'Languages spoken': {
      multi_select: asMultiSelect(data.languages_spoken),
    },
    'Date submitted': {
      date: { start: new Date().toISOString().split('T')[0] },
    },
    Country: {
      select: { name: data.country },
    },
    City: {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.city, 120) } }],
    },
    Location: {
      rich_text: [
        { type: 'text', text: { content: truncateRichText(data.city + ', ' + data.country, 120) } },
      ],
    },
  }
  if (data.contributions) {
    props['Recent Contributions'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.contributions, 1900) } }],
    }
  }
  if (data.monthly_commitment) {
    props['Monthly commitment'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.monthly_commitment) } }],
    }
  }
  if (data.skills) {
    props['Skills (frameworks, tools, languages)'] = {
      rich_text: [{ type: 'text', text: { content: truncateRichText(data.skills) } }],
    }
  }
  if (data.why_you_want_to_join) {
    props['Why do you want to join the program'] = {
      rich_text: [
        { type: 'text', text: { content: truncateRichText(data.why_you_want_to_join, 1800) } },
      ],
    }
  }
  if (data.discord) {
    props['Discord username'] = {
      rich_text: [{ type: 'text', text: { content: data.discord } }],
    }
  }
  if (data.github) {
    props['GitHub Profile'] = {
      rich_text: [{ type: 'text', text: { content: data.github } }],
    }
  }
  if (data.twitter) {
    props['Twitter handle'] = {
      rich_text: [{ type: 'text', text: { content: data.twitter } }],
    }
  }

  return props
}
