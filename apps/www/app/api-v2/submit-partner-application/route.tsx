import { after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  partnerApplicationSchema,
  type PartnerApplication,
  type PartnerApplicationResponse,
} from '~/data/partners/partnerApplication.utils'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

async function verifyHCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY

  if (!secret) {
    console.error('HCAPTCHA_SECRET_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('hCaptcha verification error:', error)
    return false
  }
}

async function triggerHubSpotWorkflow(
  contactData: PartnerApplication['contact'],
  partnerId: number
) {
  console.log('HUBSPOT WORKFLOW (TO BE CREATED)', { email: contactData.email, partnerId })
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_MISC_USE_URL
  const supabaseServiceKey = process.env.MISC_USE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Server misconfigured: missing Supabase credentials',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate request body
  const parsed = partnerApplicationSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 422,
      }
    )
  }

  const data = parsed.data

  // Verify hCaptcha token
  const captchaValid = await verifyHCaptcha(data.captchaToken)
  if (!captchaValid) {
    return new Response(
      JSON.stringify({ success: false, message: 'Captcha verification failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check if slug is already taken
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('slug')
      .eq('slug', data.partner.slug)
      .maybeSingle()

    if (existingPartner) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'This slug is already taken. Please choose a different one.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if contact already exists by email
    const { data: existingContact } = await supabase
      .from('partner_contacts')
      .select('id')
      .eq('email', data.contact.email)
      .maybeSingle()

    let contactId: number

    if (existingContact) {
      // Update existing contact
      const { error: updateError } = await supabase
        .from('partner_contacts')
        .update({
          first: data.contact.first,
          last: data.contact.last,
          company: data.contact.company,
          country: data.contact.country,
          website: data.contact.website,
          phone: data.contact.phone || null,
          title: data.contact.title || null,
          size: data.contact.size || null,
          details: data.contact.details || null,
          type: 'technology', // Set type for integration partners
        })
        .eq('id', existingContact.id)

      if (updateError) {
        console.error('Error updating contact:', updateError)
        return new Response(
          JSON.stringify({ success: false, message: 'Error updating contact information' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      contactId = existingContact.id
    } else {
      // Insert new contact
      const { data: newContact, error: insertError } = await supabase
        .from('partner_contacts')
        .insert({
          first: data.contact.first,
          last: data.contact.last,
          email: data.contact.email,
          company: data.contact.company,
          country: data.contact.country,
          website: data.contact.website,
          phone: data.contact.phone || null,
          title: data.contact.title || null,
          size: data.contact.size || null,
          details: data.contact.details || null,
          type: 'technology', // Set type for integration partners
        })
        .select('id')
        .single()

      if (insertError || !newContact) {
        console.error('Error inserting contact:', insertError)
        return new Response(
          JSON.stringify({ success: false, message: 'Error saving contact information' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      contactId = newContact.id
    }

    // Insert partner with approved = false
    const { data: newPartner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        slug: data.partner.slug,
        type: 'technology',
        category: data.partner.category,
        developer: data.partner.developer,
        title: data.partner.title,
        description: data.partner.description,
        logo: data.partner.logo,
        overview: data.partner.overview,
        website: data.partner.website,
        docs: data.partner.docs || null,
        video: data.partner.video || null,
        call_to_action_link: data.partner.call_to_action_link || null,
        contact: contactId,
        approved: false, // Always set to false for new applications
      })
      .select('id')
      .single()

    if (partnerError || !newPartner) {
      console.error('Error inserting partner:', partnerError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error saving partner information' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Trigger HubSpot workflow after response is sent
    after(() => {
      triggerHubSpotWorkflow(data.contact, newPartner.id)
    })

    const response: PartnerApplicationResponse = {
      success: true,
      message:
        'Your partner application has been submitted successfully! We will review it and get back to you soon.',
      partnerId: newPartner.id,
      contactId,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    console.error('Error submitting partner application:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}
