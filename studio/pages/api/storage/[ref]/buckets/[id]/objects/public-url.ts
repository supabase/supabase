import { createClient } from '@supabase/supabase-js'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

const iechor = createClient(process.env.IECHOR_URL!, process.env.IECHOR_SERVICE_KEY!)

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { path } = req.body

  const { data } = supabase.storage.from(id as string).getPublicUrl(path)

  // change the domain name to the IECHOR_PUBLIC_URL since IECHOR_URL is not accessible from the client
  const publicUrl = new URL(data.publicUrl)
  const parsed = new URL(process.env.IECHOR_PUBLIC_URL!)
  publicUrl.protocol = parsed.protocol
  publicUrl.host = parsed.host
  data.publicUrl = publicUrl.href

  return res.status(200).json(data)
}
