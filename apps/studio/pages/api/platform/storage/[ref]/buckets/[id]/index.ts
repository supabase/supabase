import { NextApiRequest, NextApiResponse } from 'next'

import { getProjectClient } from '@/lib/console-bff'

// [console fork] Per-project Storage bucket (get/update/delete) via the project's
// running data plane, replacing the upstream single-project global client.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')
  const supabase = await getProjectClient(req, ref)
  if (!supabase) return res.status(503).json({ error: { message: 'Project is not running' } })

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, supabase)
    case 'PATCH':
      return handlePatch(req, res, supabase)
    case 'DELETE':
      return handleDelete(req, res, supabase)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
      return res.status(405).json({ data: null, error: { message: `Method ${req.method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse, supabase: any) => {
  const { id } = req.query
  const { data, error } = await supabase.storage.getBucket(id as string)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse, supabase: any) => {
  const { id } = req.query
  const {
    public: isPublicBucket,
    allowed_mime_types: allowedMimeTypes,
    file_size_limit: fileSizeLimit,
  } = req.body

  const { data, error } = await supabase.storage.updateBucket(id as string, {
    public: isPublicBucket,
    allowedMimeTypes,
    fileSizeLimit,
  })
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse, supabase: any) => {
  const { id } = req.query
  // A bucket must be empty before it can be removed.
  await supabase.storage.emptyBucket(id as string)
  const { data, error } = await supabase.storage.deleteBucket(id as string)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
