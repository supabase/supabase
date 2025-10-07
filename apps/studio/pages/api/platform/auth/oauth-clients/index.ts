import { createClient } from '@supabase/supabase-js'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const { data, error } = await supabase.auth.admin.oauth.listClients()
  if (error) {
    return res.status(500).json({ error: { message: 'Internal Server Error' } })
  }

  return res.status(200).json(data)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { client_name, client_uri, redirect_uris, scope } = req.body

  const { data, error } = await supabase.auth.admin.oauth.createClient({
    client_name,
    client_uri,
    redirect_uris,
    scope,
  })

  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  return res.status(200).json(data)
}
