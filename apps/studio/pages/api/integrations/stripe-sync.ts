import { waitUntil } from '@vercel/functions'
import { NextApiRequest, NextApiResponse } from 'next'
import { VERSION } from 'stripe-experiment-sync'
import { install, uninstall } from 'stripe-experiment-sync/supabase'
import { z } from 'zod'

const InstallBodySchema = z.object({
  projectRef: z.string().min(1),
  stripeSecretKey: z.string().min(1),
  startTime: z.number().positive().optional(),
})

const UninstallBodySchema = z.object({
  projectRef: z.string().min(1),
  startTime: z.number().positive().optional(),
})

export const config = {
  maxDuration: 300, // 5 minutes, since the installation process can take a while even if happening in background
}

async function isStripeSyncEnabled() {
  // The ConfigClient doesn't seem to work properly so we'll just gate access from the frontend
  // for now
  return true
}

// Extract the bearer token from the request. Returns an empty string
// if bearer token can't be extracted
function getBearerToken(req: NextApiRequest): string {
  const authHeader = req.headers.authorization
  if (!authHeader || Array.isArray(authHeader)) return ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

// Returns true if the projectRef passed is a non-branch project, false otherwise
async function canAccessProject(projectRef: string, accessToken: string): Promise<boolean> {
  const url = `${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/projects/${projectRef}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  return response.ok
}

// Returns all projects refs
async function getAllProjects(accessToken: string): Promise<string[]> {
  const url = `${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/projects`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (response.ok) {
    const projects = (await response.json()) as Array<{ ref?: string }>
    return Array.isArray(projects)
      ? projects
          .map((project) => project.ref)
          .filter((projectRef): projectRef is string => Boolean(projectRef))
      : []
  } else {
    return []
  }
}

// Returns all branch project refs of a give projectRef
async function getAllBranches(projectRef: string, accessToken: string): Promise<string[]> {
  const url = `${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/projects/${projectRef}/branches`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (response.ok) {
    const branches = (await response.json()) as Array<{ project_ref?: string }>
    return Array.isArray(branches)
      ? branches
          .map((branch) => branch.project_ref)
          .filter((projectRef): projectRef is string => Boolean(projectRef))
      : []
  } else {
    return []
  }
}

// Authenticates with Supabase management API. Returns null if the accessToken has
// access to the projectRef project, other returns an error string
async function authenticateWithSupabase(
  projectRef: string,
  accessToken: string | null
): Promise<string | null> {
  if (!accessToken) {
    return 'Unauthorized: Invalid credentials'
  }

  // First we check if the token can return the project directly
  // If it does then the token is valid for this project and
  // we authenticate the request
  const tokenCanAccesProject = await canAccessProject(projectRef, accessToken)
  if (tokenCanAccesProject) {
    return null
  }

  // If the token does not return a project then projectRef could be a branch
  // project, in which case we enumerate branch projects of all projects
  const allProjectRefs = await getAllProjects(accessToken)
  for (const ref of allProjectRefs) {
    const branches = await getAllBranches(ref, accessToken)
    if (branches.includes(projectRef)) {
      return null
    }
  }

  // It's not even a branch project
  return 'Unauthorized: Invalid credentials'
}

// Authenticates withe stripe using the stripeApiKey. Return null if the authentication
// succeeded, otherwise returns an error string
async function authenticateWithStripe(stripeApiKey: string): Promise<string | null> {
  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json()
      const errorMessage =
        errorData.error?.message || `Invalid Stripe API key (HTTP ${stripeResponse.status})`
      return errorMessage
    }
  } catch (error) {
    const normalizedErrorMessage = error instanceof Error ? error.message : String(error)
    const errorMessage = `Failed to validate Stripe API key: ${normalizedErrorMessage}`
    return errorMessage
  }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hide endpoint if the integration is disabled.
  if (!(await isStripeSyncEnabled())) {
    return res.status(404).json({ data: null, error: { message: 'Not Found' } })
  }

  const { method } = req
  switch (method) {
    case 'POST':
      return handleSetupStripeSyncInstall(req, res)
    case 'DELETE':
      return handleDeleteStripeSyncInstall(req, res)
    default:
      return res
        .status(405)
        .json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleDeleteStripeSyncInstall(req: NextApiRequest, res: NextApiResponse) {
  const parsed = UninstallBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Invalid request body' } })
  }
  const { projectRef, startTime } = parsed.data

  const supabaseToken = getBearerToken(req)
  const supabaseAuthError = await authenticateWithSupabase(projectRef, supabaseToken)
  if (supabaseAuthError) {
    return res.status(401).json({ data: null, error: { message: supabaseAuthError } })
  }

  waitUntil(
    uninstall({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
      supabaseManagementUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
      startTime,
    }).catch((error) => {
      console.error('Stripe Sync Engine uninstallation failed.', error)
      throw error
    })
  )

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync uninstallation initiated' }, error: null })
}

async function handleSetupStripeSyncInstall(req: NextApiRequest, res: NextApiResponse) {
  const parsed = InstallBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ data: null, error: { message: 'Bad Request: Invalid request body' } })
  }
  const { projectRef, stripeSecretKey, startTime } = parsed.data

  const supabaseToken = getBearerToken(req)
  const supabaseAuthError = await authenticateWithSupabase(projectRef, supabaseToken)
  if (supabaseAuthError) {
    return res.status(401).json({ data: null, error: { message: supabaseAuthError } })
  }

  const stripeAuthError = await authenticateWithStripe(stripeSecretKey)
  if (stripeAuthError) {
    return res.status(401).json({
      data: null,
      error: { message: stripeAuthError },
    })
  }

  waitUntil(
    install({
      supabaseAccessToken: supabaseToken,
      supabaseProjectRef: projectRef,
      stripeKey: stripeSecretKey,
      baseProjectUrl: process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN,
      supabaseManagementUrl: process.env.NEXT_PUBLIC_API_DOMAIN,
      packageVersion: VERSION,
      startTime,
    }).catch((error) => {
      console.error('Stripe Sync Engine installation failed.', error)
      throw error
    })
  )

  return res
    .status(200)
    .json({ data: { message: 'Stripe Sync setup initiated', version: VERSION }, error: null })
}
