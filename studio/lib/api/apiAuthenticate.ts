import type { NextApiRequest, NextApiResponse } from 'next'
import { Claims } from '@auth0/nextjs-auth0'
import { readOnly } from './supabaseClient'
import { SupaResponse, User } from 'types'
import { auth0 } from './auth0'
import { flattenNamespaceOnUser } from './apiHelpers'

/**
 * Use this method on api routes to check if user is authenticated and having required permissions.
 * This method can only be used from the server side.
 * Member permission is mandatory whenever orgSlug/projectRef query param exists
 * @param {NextApiRequest}    req
 * @param {NextApiResponse}   res
 * @param {Object}            config      requireUserDetail: bool, requireOwner: bool
 *
 * @returns {Object<user, error, description>}
 *   user null, with error and description if not authenticated or not enough permissions
 */
export async function apiAuthenticate(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SupaResponse<User>> {
  if (!req) {
    return { error: new Error('Request is not available') } as unknown as SupaResponse<User>
  }

  if (!res) {
    return { error: new Error('Response is not available') } as unknown as SupaResponse<User>
  }

  const { slug: orgSlug, ref: projectRef } = req.query
  try {
    // Check that they are logged in
    // If no error throw from getAccessToken. That's good, we can continue
    await auth0.getAccessToken(req, res)

    const user = await fetchUser(req, res)
    if (!user) {
      return { error: new Error('The user does not exist') } as unknown as SupaResponse<User>
    }

    if (orgSlug || projectRef) await checkMemberPermission(req, user)

    return user
  } catch (error: any) {
    console.error('Error at apiAuthenticate', error)
    return { error: { message: error.message ?? 'unknown' } } as unknown as SupaResponse<User>
  }
}

/**
 * @returns
 *  user with only id prop or detail object. It depends on requireUserDetail config
 */
async function fetchUser(req: NextApiRequest, res: NextApiResponse): Promise<any> {
  const session = auth0.getSession(req, res)

  if (!session) {
    return null
  }

  const { user: auth0_user } = session
  const flattened = flattenNamespaceOnUser('https://supabase.io', auth0_user)
  const { user_id_supabase, user_id_auth0, email } = flattened

  if (user_id_supabase) {
    return {
      id: user_id_supabase,
      primary_email: email,
    }
  }

  const { data } = await readOnly
    .from('users')
    .select(
      `
      id, auth0_id, primary_email, username, first_name, last_name, mobile, is_alpha_user
    `
    )
    .eq('auth0_id', user_id_auth0)
    .single()

  return data
}

async function checkMemberPermission(req: NextApiRequest, user: Claims) {
  const org = await getOrganization(req)
  if (!org) {
    throw new Error('User organization does not exist')
  }

  try {
    const response = await readOnly
      .from('members')
      .select('id')
      .match({ organization_id: org.id, user_id: user.id })
      .single()

    if (!response || response.status != 200) {
      throw new Error('The user does not have permission')
    }
    return true
  } catch (error) {
    throw new Error('The user does not have permission')
  }
}

async function getOrganization(req: NextApiRequest) {
  const { slug: orgSlug, ref: projectRef } = req.query
  if (!orgSlug && !projectRef) {
    throw new Error('Not enough info to check user permissions')
  }

  if (orgSlug) {
    const { data } = await readOnly
      .from('organizations')
      .select('id')
      .match({ slug: orgSlug })
      .single()
    return { id: data.id }
  }

  if (projectRef) {
    const { data } = await readOnly
      .from('projects')
      .select('organization_id')
      .match({ ref: projectRef })
      .single()
    return { id: data.organization_id }
  }

  return null
}
