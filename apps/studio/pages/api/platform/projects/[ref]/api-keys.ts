import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getProvisioner } from 'lib/api/self-hosted/provisioner'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

function maskKey(key: string | null): { masked: string | null; full: string | null } {
  if (key === null) {
    return { masked: null, full: null }
  }
  return { masked: `${key.slice(0, 8)}****`, full: key }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = req.query.ref as string
  const projects = await getProvisioner().listProjects()
  const project = projects.find((p) => p.name === ref)

  if (!project) {
    return res.status(404).json({ data: null, error: { message: `Project "${ref}" not found` } })
  }

  return res.status(200).json({
    anon_key: maskKey(project.anon_key),
    service_key: maskKey(project.service_key),
  })
}
