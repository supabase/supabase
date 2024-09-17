import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID
  const HUBSPOT_FORM_GUID = process.env.HUBSPOT_ENTERPRISE_FORM_GUID

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { firstName, secondName, companyEmail, message } = req.body

  if (!firstName || !secondName || !companyEmail || !message) {
    return res.status(400).json({ message: 'All fields are required' })
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
            pageName: 'Enterprise Form - www contact-sales',
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
      return res.status(response.status).json({ message: errorData.message })
    }

    return res.status(200).json({ message: 'Submission successful' })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
