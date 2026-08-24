import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

// eslint-disable-next-line import/no-anonymous-default-export
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

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query

  const { data, error } = await supabase.storage.vectors
    .from(id as string)
    .listIndexes({ maxResults: 100 })

  if (error) return res.status(500).json({ error: { message: error.message } })

  const indexes = await Promise.all(
    data.indexes.map(async ({ indexName }) => {
      return (await supabase.storage.vectors.from(id as string).getIndex(indexName)).data?.index
    })
  )

  return res.status(200).json({ indexes, nextToken: data.nextToken })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const { indexName, dataType, dimension, distanceMetric, metadataKeys } = req.body
  const payload = {
    indexName,
    dataType,
    dimension,
    distanceMetric,
    metadataConfiguration: { nonFilterableMetadataKeys: metadataKeys },
  }

  const { data, error } = await supabase.storage.vectors.from(id as string).createIndex(payload)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
