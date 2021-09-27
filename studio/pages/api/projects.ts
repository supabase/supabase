// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
const projects = require('lib/user-projects.json')

type Project = {
  id: string
  name: string
}

export default (req: NextApiRequest, res: NextApiResponse<[Project]>) => {
  res.status(200).json(projects)
}
