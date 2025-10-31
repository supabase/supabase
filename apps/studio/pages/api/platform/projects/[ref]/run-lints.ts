import { NextApiRequest, NextApiResponse } from 'next'

import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { getLints } from 'lib/api/self-hosted/lints'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      // [Joshen] JFYI it seems like the exposed schemas is being hardcoded for self-host here
      // https://github.com/supabase/supabase/blob/master/apps/studio/pages/api/platform/projects/%5Bref%5D/config/postgrest.ts#L23
      // Not exactly sure if that's supposed to be the case but if it's meant to be configured dynamically somewhere
      // we should update in config/postgrest.ts and here
      const { data, error } = await getLints({
        headers: constructHeaders(req.headers),
        exposedSchemas: 'public, storage',
      })

      if (error) {
        return res.status(400).json(error)
      } else {
        return res.status(200).json(data)
      }
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
