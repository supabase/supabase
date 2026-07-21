import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json([
    {
      id: 1,
      name: 'Alazab Organization',
      slug: 'alazab-org',
      billing_email: 'admin@alazab.com',
      is_owner: true,
      stripe_customer_id: null,
      paused: false,
    }
  ])
}
