import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Disable Draft Mode by clearing the cookie
  res.setDraftMode({ enable: false })

  // Redirect to the homepage or wherever you want
  res.redirect('/')
}
