import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'

const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')
const HUBSPOT_PORTAL = Deno.env.get('HUBSPOT_PORTAL')
const PARTNER_FORM_ID = Deno.env.get('PARTNER_FORM_ID')
const ENTERPRISE_FORM_ID = Deno.env.get('ENTERPRISE_FORM_ID')
const DPA_FORM_ID = Deno.env.get('DPA_FORM_ID')
const SOC2_FORM_ID = Deno.env.get('SOC2_FORM_ID')

serve(async (req) => {
  const requestSecret = req.headers.get('x-function-secret')

  if (FUNCTION_SECRET !== requestSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const input = await req.json()

  const supabase_table_id = input.record.id
  const country = input.record.country
  const form_note = input.record.details
  const company = input.record.company_name || input.record.company
  const company_size = input.record.company_size || input.record.size
  const email = input.record.contact_email || input.record.email
  const phone = input.record.contact_phone || input.record.phone
  const lastName = input.record.contact_last_name || input.record.last
  const firstName = input.record.contact_first_name || input.record.first
  const jobtitle = input.record.title
  const website = input.record.website
  const partner_gallery_type = input.record.type

  let formData: object = { email }

  switch (input.table) {
    case 'partner_contacts':
      formData = {
        ...formData,
        supabase_table_id,
        country,
        form_note,
        company,
        company_size,
        phone,
        lastName,
        firstName,
        jobtitle,
        website,
        partner_gallery_type,
      }
      break
    case 'soc2_requests':
    case 'enterprise_contacts':
      formData = {
        ...formData,
        supabase_table_id,
        country,
        form_note,
        company,
        company_size,
        email,
        phone,
        lastName,
        firstName,
      }
      break
    case 'dpa_downloads':
      formData = { ...formData }
      break
    default:
      break
  }

  const fields: { objectTypeId: '0-1'; name: string; value: string }[] = []
  for (const [key, value] of Object.entries(formData)) {
    fields.push({ objectTypeId: '0-1', name: key, value: value || 'NOT_PROVIDED' })
  }

  const formId =
    input.table === 'partner_contacts'
      ? PARTNER_FORM_ID
      : input.table === 'dpa_downloads'
        ? DPA_FORM_ID
        : input.table === 'soc2_requests'
          ? SOC2_FORM_ID
          : ENTERPRISE_FORM_ID

  // Using HubSpot's submit data to a form API
  // https://legacydocs.hubspot.com/docs/methods/forms/submit_form
  const formResponse = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL}/${formId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields,
      }),
    }
  )

  // Will create a deal using HubSpot's workflow tool instead of via API

  if (!formResponse.ok) {
    console.log(`Failed to submit form data to HubSpot`, await formResponse.json())
    return new Response(`Failed to submit form data to HubSpot`, {
      status: 500,
    })
  }

  return new Response(JSON.stringify({ done: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
