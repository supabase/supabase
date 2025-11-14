import { NextApiRequest, NextApiResponse } from 'next'

import apiWrapper from 'lib/api/apiWrapper'

const organizationSlugHandler = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler)

export default organizationSlugHandler

// In-memory storage for organization data (persists during runtime)
// Key: organization slug, Value: organization data
const organizationStore = new Map<string, any>()

// Default organization data
const DEFAULT_ORG_SLUG = 'default-org-slug'
const DEFAULT_ORGANIZATION = {
  id: 1,
  name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
  slug: DEFAULT_ORG_SLUG,
  billing_email: 'billing@supabase.co',
  stripe_customer_id: 'cus_local_dev',
  opt_in_tags: [] as string[],
  plan: {
    id: 'enterprise',
    name: 'Enterprise',
  },
}

// Initialize default organization
function getOrganization(slug: string) {
  if (!organizationStore.has(slug)) {
    // Initialize with default data for the default org
    if (slug === DEFAULT_ORG_SLUG) {
      organizationStore.set(slug, { ...DEFAULT_ORGANIZATION })
    } else {
      return null
    }
  }
  return organizationStore.get(slug)
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query

  if (typeof slug !== 'string') {
    return res.status(400).json({
      error: { message: 'Invalid organization slug' },
    })
  }

  const organization = getOrganization(slug)

  if (!organization) {
    return res.status(404).json({
      error: { message: 'Organization not found' },
    })
  }

  return res.status(200).json(organization)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query
  const { name, billing_email, opt_in_tags, additional_billing_emails } = req.body

  if (typeof slug !== 'string') {
    return res.status(400).json({
      error: { message: 'Invalid organization slug' },
    })
  }

  const organization = getOrganization(slug)

  if (!organization) {
    return res.status(404).json({
      error: { message: 'Organization not found' },
    })
  }

  // Update organization properties
  const updatedOrganization = {
    ...organization,
  }

  if (name !== undefined) {
    updatedOrganization.name = name
  }

  if (billing_email !== undefined) {
    updatedOrganization.billing_email = billing_email
  }

  if (opt_in_tags !== undefined) {
    // Validate opt_in_tags is an array
    if (!Array.isArray(opt_in_tags)) {
      return res.status(400).json({
        error: { message: 'opt_in_tags must be an array' },
      })
    }
    updatedOrganization.opt_in_tags = opt_in_tags
  }

  if (additional_billing_emails !== undefined) {
    updatedOrganization.additional_billing_emails = additional_billing_emails
  }

  // Store updated organization
  organizationStore.set(slug, updatedOrganization)

  // Return updated organization (matching API spec)
  const response = {
    id: updatedOrganization.id,
    name: updatedOrganization.name,
    slug: updatedOrganization.slug,
    billing_email: updatedOrganization.billing_email,
    stripe_customer_id: updatedOrganization.stripe_customer_id,
    opt_in_tags: updatedOrganization.opt_in_tags,
  }

  return res.status(200).json(response)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query

  if (typeof slug !== 'string') {
    return res.status(400).json({
      error: { message: 'Invalid organization slug' },
    })
  }

  const organization = getOrganization(slug)

  if (!organization) {
    return res.status(404).json({
      error: { message: 'Organization not found' },
    })
  }

  // Remove organization from store
  organizationStore.delete(slug)

  return res.status(200).json({
    message: 'Organization deleted successfully',
  })
}
