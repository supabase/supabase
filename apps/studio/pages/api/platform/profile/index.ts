import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2 } from '../../constants'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  // Platform specific endpoint
  const response = {
    id: 1,
    primary_email: 'johndoe@supabase.io',
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
    organizations: [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        projects: [
          { ...DEFAULT_PROJECT, connectionString: '' },
          { ...DEFAULT_PROJECT_2, connectionString: '' },
        ],
      },
    ],
  }
  return res.status(200).json(response)
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
    ...req.body,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
})

export default apiHandler
