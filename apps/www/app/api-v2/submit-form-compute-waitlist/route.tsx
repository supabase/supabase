import * as Sentry from '@sentry/nextjs'
import { parseProjectRef } from '~/lib/compute-project-ref'
import { CustomerioTrackClient } from '~/lib/customerio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5
const ipRequestMap = new Map<string, { count: number; resetAt: number }>()

const MAX_FIELD_LENGTH = 255
const MAX_DETAILS_LENGTH = 2000
const USE_CASE_OPTIONS = ['sandboxes', 'services', 'both']

const isFilledString = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength

const isOptionalString = (value: unknown, maxLength: number): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.length <= maxLength)

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

export async function POST(req: Request) {
  const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID
  const HUBSPOT_FORM_GUID = process.env.HUBSPOT_COMPUTE_WAITLIST_FORM_GUID

  // x-vercel-forwarded-for is set by the platform and cannot be spoofed by the client.
  const ip =
    req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  const now = Date.now()

  // Drop expired entries so the map doesn't grow unbounded on a long-lived instance.
  for (const [key, value] of ipRequestMap) {
    if (now >= value.resetAt) ipRequestMap.delete(key)
  }

  const entry = ipRequestMap.get(ip)

  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ message: 'Too many requests. Try again later.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      })
    }
    entry.count++
  } else {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
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

  const { firstName, lastName, email, company, projectRef, useCase, details, honeypot } = body

  // Anti-spam honeypot: real users never fill this hidden field.
  if (honeypot) {
    return new Response(JSON.stringify({ message: 'Submission successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  if (
    !isFilledString(firstName, MAX_FIELD_LENGTH) ||
    !isFilledString(lastName, MAX_FIELD_LENGTH) ||
    !isFilledString(email, MAX_FIELD_LENGTH)
  ) {
    return new Response(JSON.stringify({ message: 'Name and email are required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  if (
    !isOptionalString(company, MAX_FIELD_LENGTH) ||
    !isOptionalString(details, MAX_DETAILS_LENGTH) ||
    !(
      useCase === undefined ||
      useCase === null ||
      useCase === '' ||
      USE_CASE_OPTIONS.includes(useCase)
    )
  ) {
    return new Response(JSON.stringify({ message: 'Invalid form values' }), {
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

  const parsedProjectRef =
    typeof projectRef === 'string' && projectRef.length <= MAX_FIELD_LENGTH
      ? parseProjectRef(projectRef)
      : null

  if (projectRef && !parsedProjectRef) {
    return new Response(JSON.stringify({ message: 'Invalid project ID' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  try {
    if (!HUBSPOT_PORTAL_ID || !HUBSPOT_FORM_GUID) {
      throw new Error('HubSpot credentials not configured')
    }

    const fields = [
      { objectTypeId: '0-1', name: 'firstname', value: firstName },
      { objectTypeId: '0-1', name: 'lastname', value: lastName },
      { objectTypeId: '0-1', name: 'email', value: email },
      ...(company ? [{ objectTypeId: '0-1', name: 'company', value: company }] : []),
      ...(parsedProjectRef
        ? [{ objectTypeId: '0-1', name: 'supabase_project_ref', value: parsedProjectRef }]
        : []),
      ...(useCase ? [{ objectTypeId: '0-1', name: 'compute_use_case', value: useCase }] : []),
      ...(details ? [{ objectTypeId: '0-1', name: 'message', value: details }] : []),
    ]

    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: 'https://supabase.com/compute',
            pageName: 'Compute Private Alpha Waitlist',
          },
          legalConsentOptions: {
            consent: {
              consentToProcess: true,
              text: 'By submitting this form, you acknowledge that Supabase Compute is offered as a private alpha preview, provided on an "as is" and "as available" basis without warranties of any kind. It is intended for internal evaluation only and should not be used to serve production workloads or your own end customers. Supabase may modify, suspend, or discontinue the preview at any time without notice, and there is no guarantee it will become a generally available product. You confirm you are authorized to submit this request on behalf of your organization, and that you have read and understood our Privacy Policy.',
            },
          },
        }),
      }
    )

    if (!response.ok) {
      // Read as text: HubSpot doesn't always return JSON on errors, and a parse
      // failure here would mask the real status behind the catch-all 500 below.
      const errorBody = await response.text()
      Sentry.captureException(new Error(`HubSpot form submission failed: ${errorBody}`))
      return new Response(JSON.stringify({ message: 'Submission failed. Please try again.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    await saveWaitlistSignupInCustomerIO({
      email,
      firstName,
      lastName,
      company,
      projectRef: parsedProjectRef,
      useCase,
    })

    return new Response(JSON.stringify({ message: 'Submission successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    Sentry.captureException(error)
    return new Response(JSON.stringify({ message: 'Submission failed. Please try again.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Mirror the signup into Customer.io so waitlist members can be segmented and
// emailed without a HubSpot sync. HubSpot stays the source of record: a
// Customer.io failure is reported to Sentry and never fails the submission.
// Never set `unsubscribed` or subscription preferences here, so a signup
// can't resubscribe someone who opted out.
const saveWaitlistSignupInCustomerIO = async (signup: {
  email: string
  firstName: string
  lastName: string
  company?: string
  projectRef: string | null
  useCase?: string
}) => {
  const customerioSiteId = process.env.CUSTOMERIO_SITE_ID
  const customerioApiKey = process.env.CUSTOMERIO_API_KEY

  if (!customerioSiteId || !customerioApiKey) {
    Sentry.captureException(new Error('Customer.io credentials not configured'))
    return
  }

  try {
    const cio = new CustomerioTrackClient(customerioSiteId, customerioApiKey)
    const now = new Date().toISOString()
    const timestamp = cio.isoToUnixTimestamp(now)

    // Profile attributes drive segment membership. Names stay on the event
    // so the form can't overwrite names already on existing profiles.
    await cio.createOrUpdateProfile(signup.email, {
      compute_waitlist_joined_at: timestamp,
      ...(signup.projectRef ? { compute_project_ref: signup.projectRef } : {}),
    })

    // The event only triggers campaigns.
    await cio.trackEvent(signup.email, {
      userId: signup.email,
      type: 'track',
      event: 'waitlist_joined',
      properties: {
        waitlist: 'compute',
        first_name: signup.firstName,
        last_name: signup.lastName,
        ...(signup.company ? { company: signup.company } : {}),
        ...(signup.projectRef ? { project_ref: signup.projectRef } : {}),
        ...(signup.useCase ? { use_case: signup.useCase } : {}),
        source: 'compute_waitlist_form',
        submitted_at: now,
      },
      timestamp,
    })
  } catch (error) {
    Sentry.captureException(error)
  }
}
