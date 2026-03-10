import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import { toStudioProject } from 'lib/constants/api'
import { projectNameSchema } from '@hosted-supabase/schema-provisioner'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handleCreate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (_req: NextApiRequest, res: NextApiResponse) => {
  const projects = await getProvisioner().listProjects()
  return res.status(200).json(projects.map(toStudioProject))
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.body ?? {}

  // Validate name using the same schema the provisioner uses
  const parsed = projectNameSchema.safeParse(name)
  if (!parsed.success) {
    return res.status(400).json({
      data: null,
      error: { message: `Invalid project name: ${parsed.error.issues[0]?.message ?? 'invalid'}` },
    })
  }

  try {
    const project = await getProvisioner().createProject({ name: parsed.data })
    return res.status(201).json(toStudioProject(project))
  } catch (err) {
    return res.status(500).json({
      data: null,
      error: { message: (err as Error).message ?? 'Failed to create project' },
    })
  }
}
