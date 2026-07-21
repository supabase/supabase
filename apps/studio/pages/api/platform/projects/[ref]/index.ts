import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ref } = req.query
  return res.status(200).json({
    id: 1,
    ref: ref,
    name: 'Alazab Project',
    organization_id: 1,
    cloud_provider: 'self-hosted',
    region: 'local',
    status: 'ACTIVE_HEALTHY',
    inserted_at: new Date().toISOString(),
  })
}
