import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import { toStudioProject } from 'lib/constants/api'

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
  const ref = req.query.ref as string

  try {
    const updated = await getProvisioner().rotateKeys(ref)
    // Return the studio project shape plus the raw new keys for the UI to display
    return res.status(200).json({
      ...toStudioProject(updated),
      anon_key: updated.anon_key,
      service_key: updated.service_key,
    })
  } catch (err) {
    const message = (err as Error).message ?? 'Key rotation failed'
    // rotateKeys throws "Project not found" when ref doesn't exist
    if (message.includes('not found')) {
      return res.status(404).json({ data: null, error: { message } })
    }
    return res.status(500).json({ data: null, error: { message } })
  }
}
