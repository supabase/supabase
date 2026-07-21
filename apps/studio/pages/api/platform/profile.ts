import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    id: 1,
    primary_email: 'admin@alazab.com',
    username: 'alazab',
    first_name: 'Alazab',
    last_name: 'Admin',
    is_alpha_user: true,
    free_project_limit: 100,
  })
}
