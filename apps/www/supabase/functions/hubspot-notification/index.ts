import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'

const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')
const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY')
const OWNER_ID = Deno.env.get('OWNER_ID')
const ENTERPRISE_PIPELINE = Deno.env.get('ENTERPRISE_PIPELINE')
const PARTNERS_PIPELINE = Deno.env.get('PARTNERS_PIPELINE')
const ENTERPRISE_DEAL_STAGE = Deno.env.get('ENTERPRISE_DEAL_STAGE')
const PARTNERS_DEAL_STAGE = Deno.env.get('PARTNERS_DEAL_STAGE')

serve(async (req) => {
  const requestSecret = req.headers.get('x-function-secret')

  if (FUNCTION_SECRET !== requestSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const input = await req.json()

  const firstName = input.record.contact_first_name || input.record.first
  const lastName = input.record.contact_last_name || input.record.last
  const company = input.record.company_name || input.record.company
  const email = input.record.contact_email || input.record.email
  const phone = input.record.contact_phone || input.record.phone

  const contactResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts?hapikey=${HUBSPOT_API_KEY}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          company,
          email,
          firstname: firstName,
          lastname: lastName,
          phone,
        },
      }),
    }
  )

  const body = await contactResponse.json()

  let contactId: string | null = null

  if (contactResponse.ok) {
    contactId = body.id
  } else {
    if (body.status === 'error' && body.category === 'CONFLICT') {
      // fetch existing contact
      const contactAssociateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email&hapikey=${HUBSPOT_API_KEY}`
      )

      const body = await contactAssociateResponse.json()

      if (contactAssociateResponse.ok) {
        contactId = body.id
      } else {
        console.log(`Failed to fetch contact`, body)
        return new Response(`Failed to fetch contact`, { status: 500 })
      }
    } else {
      console.log(`Failed to create contact`, body)
      return new Response(`Failed to create contact`, { status: 500 })
    }
  }

  const noteContent = Object.entries(input.record).reduce(
    (acc, [key, value]) => acc + `${key}: ${value || 'NOT_PROVIDED'}<br />`,
    ''
  )

  // Add note
  const noteResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/notes?hapikey=${HUBSPOT_API_KEY}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_timestamp: Date.now(),
          hs_note_body: noteContent,
          hubspot_owner_id: OWNER_ID,
        },
      }),
    }
  )

  const noteBody = await noteResponse.json()

  if (!noteResponse.ok) {
    console.log(`Failed to add note`, noteBody)
    return new Response(`Failed to add note`, { status: 500 })
  }

  const noteId = noteBody.id

  // Associate note with contact
  const noteAssociateResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact?hapikey=${HUBSPOT_API_KEY}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  )

  if (!noteAssociateResponse.ok) {
    console.log(`Failed to associate note`, await noteAssociateResponse.json())
    return new Response(`Failed to associate note`, { status: 500 })
  }

  // Create deal
  const dealCloseDate = new Date()
  dealCloseDate.setDate(dealCloseDate.getDate() + 28) // 28 days

  const dealResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals?hapikey=${HUBSPOT_API_KEY}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          closedate: dealCloseDate.toISOString(),
          dealname: company || `${firstName} ${lastName}`,
          dealstage:
            input.table === 'enterprise_contacts' ? ENTERPRISE_DEAL_STAGE : PARTNERS_DEAL_STAGE,
          hubspot_owner_id: OWNER_ID,
          pipeline: input.table === 'enterprise_contacts' ? ENTERPRISE_PIPELINE : PARTNERS_PIPELINE,
        },
      }),
    }
  )

  const dealBody = await dealResponse.json()

  if (!dealResponse.ok) {
    console.log(`Failed to create deal`, dealBody)
    return new Response(`Failed to create deal: ` + dealBody.message, { status: 500 })
  }

  const dealId = dealBody.id

  // Associate contact with a deal
  const dealAssociateResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/deals/${dealId}/contact_to_deal?hapikey=${HUBSPOT_API_KEY}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  )

  if (!dealAssociateResponse.ok) {
    console.log(`Failed to associate contact with deal`, await dealAssociateResponse.json())
    return new Response(`Failed to associate contact with deal`, { status: 500 })
  }

  return new Response(JSON.stringify({ done: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
