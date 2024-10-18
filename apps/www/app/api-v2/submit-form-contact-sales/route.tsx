const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const personalEmailDomains = [
  '@gmail.com',
  '@yahoo.com',
  '@hotmail.',
  '@outlook.com',
  '@aol.com',
  '@icloud.com',
  '@live.com',
  '@protonmail.com',
  '@mail.com',
  '@example.com',
]

const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/
  return emailPattern.test(email)
}

const isCompanyEmail = (email: string): boolean => {
  for (const domain of personalEmailDomains) {
    if (email.includes(domain)) {
      return false
    }
  }

  return true
}

export async function POST(req: Request) {
  const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID
  const HUBSPOT_FORM_GUID = process.env.HUBSPOT_ENTERPRISE_FORM_GUID

  const body = await req.json()
  const { firstName, secondName, companyEmail, message } = body

  if (!firstName || !secondName || !companyEmail || !message) {
    return new Response(JSON.stringify({ message: 'All fields are required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  // Validate email
  if (companyEmail && !isValidEmail(companyEmail)) {
    return new Response(JSON.stringify({ message: 'Invalid email address' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  // Validate company email
  if (companyEmail && !isCompanyEmail(companyEmail)) {
    return new Response(JSON.stringify({ message: 'Please use a company email address' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 422,
    })
  }

  try {
    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: [
            { objectTypeId: '0-1', name: 'firstname', value: firstName },
            { objectTypeId: '0-1', name: 'lastname', value: secondName },
            { objectTypeId: '0-1', name: 'email', value: companyEmail },
            { objectTypeId: '0-1', name: 'message', value: message },
          ],
          context: {
            pageUri: 'https://supabase.com/contact/sales',
            pageName: 'Enterprise Demo Request Form',
          },
          legalConsentOptions: {
            consent: {
              consentToProcess: true,
              text: 'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({ message: errorData.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    return new Response(JSON.stringify({ message: 'Submission successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
