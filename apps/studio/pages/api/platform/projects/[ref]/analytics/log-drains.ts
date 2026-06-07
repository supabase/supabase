import { NextApiRequest, NextApiResponse } from 'next'

// [console fork] Log drains require a Logflare backend we don't run on shared infra.
// Return an empty list so the page renders ("Add destination" empty state) instead of
// erroring; creation is not offered.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return res.status(200).json([])
    case 'POST':
      return res
        .status(400)
        .json({ error: { message: 'Log drains are not available on shared infrastructure' } })
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }
}
