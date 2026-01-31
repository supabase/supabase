import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'
import { IS_PLATFORM } from 'lib/constants'
import { getOrganizations, createOrganization } from 'lib/api/self-hosted/projects'

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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, return default organization (original behavior)
  if (IS_PLATFORM) {
    const response = [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        plan: {
          id: 'enterprise',
          name: 'Enterprise',
        },
      },
    ]
    return res.status(200).json(response)
  }

  // For self-hosted, fetch organizations from database
  try {
    const organizations = await getOrganizations()

    // If no organizations exist, return default for backwards compatibility
    if (organizations.length === 0) {
      const response = [
        {
          id: 1,
          name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
          slug: 'default',
          billing_email: 'billing@localhost',
          plan: {
            id: 'enterprise',
            name: 'Enterprise',
          },
        },
      ]
      return res.status(200).json(response)
    }

    const response = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      billing_email: 'billing@localhost',
      plan: {
        id: 'enterprise',
        name: 'Enterprise',
      },
    }))
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    // Fallback to default organization on error
    const response = [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default',
        billing_email: 'billing@localhost',
        plan: {
          id: 'enterprise',
          name: 'Enterprise',
        },
      },
    ]
    return res.status(200).json(response)
  }
}

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  // For platform, creating organizations is not supported via this endpoint
  if (IS_PLATFORM) {
    return res.status(405).json({ data: null, error: { message: 'Method Not Allowed' } })
  }

  // For self-hosted, create a new organization
  try {
    const { name, slug } = req.body

    if (!name) {
      return res.status(400).json({ data: null, error: { message: 'Organization name is required' } })
    }

    const organization = await createOrganization({ name, slug })

    if (!organization) {
      return res.status(500).json({ data: null, error: { message: 'Failed to create organization' } })
    }

    const response = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      billing_email: 'billing@localhost',
      plan: {
        id: 'enterprise',
        name: 'Enterprise',
      },
    }
    return res.status(201).json(response)
  } catch (error) {
    console.error('Error creating organization:', error)
    return res.status(500).json({ data: null, error: { message: 'Failed to create organization' } })
  }
}
