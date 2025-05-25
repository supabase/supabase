import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { query } from './_helpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type ResponseData =
  paths['/platform/projects/{ref}/content/count']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const privateCount = await query(`SELECT count(*) FROM public.snippets`, req.headers)
  const favoritesCount = await query(
    `select
      count(*)
    from
      public.snippets
    where
      (content -> 'content' ->> 'favorite')::boolean is true;`,
    req.headers
  )

  return res
    .status(200)
    .json({ shared: 0, favorites: favoritesCount[0].count, private: privateCount[0].count })
}
