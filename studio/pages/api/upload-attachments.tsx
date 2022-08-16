import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import SqlString from 'sqlstring'

import apiWrapper from 'lib/api/apiWrapper'
import { IS_PLATFORM } from 'lib/constants'
import { constructHeaders } from 'lib/api/apiHelpers'
import { post } from 'lib/common/fetch'
import { tryParseInt } from 'lib/helpers'

// [Joshen TODO] To be shifted into an env vars before doing anything
// Both bitwarden, .env, and vercel
const API_URL = 'https://mfrkmguhoejspftfvgdz.supabase.co'
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNzg4NjQ0MCwiZXhwIjoxOTQzNDYyNDQwfQ.wRGmWXOORz-cxVBof4WLOSxRog9Tdff1P8gI72U8ta8'

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
  if (!IS_PLATFORM) return res.status(200).json({})

  const supportSupabaseClient = createClient(API_URL, API_KEY)
  console.log('Upload attachments', req.body)

  console.log()
  console.log('Files', req.body.files[0])
  console.log()

  return res.status(200).json({ ping: 'pong' })
}
