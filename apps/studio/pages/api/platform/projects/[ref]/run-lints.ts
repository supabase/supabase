import { NextApiRequest, NextApiResponse } from 'next'

import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { getLints } from 'lib/api/self-hosted/lints'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      /**
       * [Joshen] JFYI technically the exposed schemas is being set here via compose.yaml
       * https://github.com/supabase/supabase/blob/master/docker/compose.yaml#L183
       * https://github.com/supabase/supabase/blob/474a78721e510301d15ca9dbd41f05ce10fa29e5/docker/.env.example#L55
       *
       * But i noticed that the local API route on config/postgrest.ts has currently hardcoded db_schema to `public, storage`
       * As such, this is only just a temporary patch here that we're hardcoding the exposed schemas but we will need to figure
       * out how to get the dashboard to retrieve the values from docker-compose
       */
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
