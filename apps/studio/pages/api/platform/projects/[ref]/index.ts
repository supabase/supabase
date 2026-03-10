import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import { toStudioProject } from 'lib/constants/api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const ref = req.query.ref as string
  const projects = await getProvisioner().listProjects()
  const project = projects.find((p) => p.name === ref)

  if (!project) {
    return res.status(404).json({ data: null, error: { message: `Project "${ref}" not found` } })
  }

  return res.status(200).json(toStudioProject(project))
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const ref = req.query.ref as string
  const { confirm } = req.body ?? {}

  // Guard: confirm must match ref before we even call the provisioner
  if (confirm !== ref) {
    return res.status(400).json({
      data: null,
      error: {
        message: `Confirmation mismatch: expected "${ref}", received "${confirm}"`,
      },
    })
  }

  await getProvisioner().dropProject(ref, { confirm })
  res.status(204).end()
}
