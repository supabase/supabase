import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { query } from './_helpers'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'PUT':
      return handlePut(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'PUT'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

type GetRequestData = paths['/platform/projects/{ref}/content']['get']['parameters']['query']

type GetResponseData =
  paths['/platform/projects/{ref}/content']['get']['responses']['200']['content']['application/json']

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse<GetResponseData>) => {
  // Platform specific endpoint
  const params = req.query as GetRequestData
  if (params?.visibility === 'project') {
    return res.status(200).json({ data: [] })
  }
  let queryString = `SELECT * FROM public.snippets`
  if (params?.favorite) {
    queryString += ` WHERE (content -> 'content' ->> 'favorite')::boolean is ${params.favorite};`
  }

  const data = await query(queryString, req.headers)
  console.log(data)
  const snippets = data.map((d) => d.content)

  res.status(200).json({ data: snippets })
}

const SnippetSchema = z.object({
  content: z.object({
    content_id: z.string(),
    sql: z.string(),
    schema_version: z.literal('1.0'),
    favorite: z.boolean(),
  }),
  description: z.string().optional(),
  folder_id: z.string().optional(),
  id: z.string(),
  name: z.string(),
  owner_id: z.number(),
  type: z.literal('sql'),
  visibility: z.union([
    z.literal('user'),
    z.literal('project'),
    z.literal('org'),
    z.literal('public'),
  ]),
})

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  return res.status(200).json({})
}

type PutRequestData =
  paths['/platform/projects/{ref}/content']['put']['requestBody']['content']['application/json']

// The response is specified as never
type PutResponseData = any

const handlePut = async (req: NextApiRequest, res: NextApiResponse<PutResponseData>) => {
  const body = req.body as PutRequestData

  const { data, error } = SnippetSchema.safeParse(body)

  if (error) {
    console.log(error)
    return res.status(500).json({ error: error.message })
  }

  const json = JSON.stringify(data, undefined, 2)
  const sqlSafeJson = json.replace(/'/g, "''")

  const result = await query(
    `INSERT INTO public.snippets (id, version,content)
     VALUES ('${data.id}', 1, '${sqlSafeJson}')
     ON CONFLICT (id) 
     DO UPDATE SET content = EXCLUDED.content
     RETURNING *;`
  )
  console.log(result)

  return res.status(200).json(null)
}
