import type { NextApiRequest, NextApiResponse } from 'next'

const HUBSPOT_PORTAL_ID = 'HS_PORTAL_ID'
const HUBSPOT_FORM_GUID = 'HS_FORM_GUID'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  console.log('req', req.body)
  const { firstName, secondName, companyEmail, message } = req.body

  if (!firstName || !secondName || !companyEmail || !message) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/secure/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: [
            { name: 'firstname', value: firstName },
            { name: 'lastname', value: secondName },
            { name: 'email', value: companyEmail },
            { name: 'message', value: message },
          ],
          context: {
            pageUri: 'https://supabase.com/contact/sales',
            pageName: 'Enterprise Sales - Request Demo contact form',
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
