import createClient from 'openapi-fetch'
import { paths } from './vela-schema'
import { VELA_PLATFORM_URL } from '../../pages/api/constants'
import { NextApiRequest } from 'next'

const velaClient = createClient<paths>({
  baseUrl: VELA_PLATFORM_URL,
  credentials: 'include',
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getVelaClient() {
  return velaClient
}

export function mustOrganizationId(req: NextApiRequest): number {
  const fromCookie = getOrganizationCookie(req)
  if (fromCookie !== -1) return fromCookie

  const header = req.headers['X-Vela-Organization-Id']
  if (!header) {
    throw new Error('Organization id not found')
  }

  if (typeof header !== 'string') {
    throw new Error('Organization id is not a string')
  }

  try {
    return parseInt(header)
  } catch (e) {
    throw new Error('Organization id is not a number')
  }
}

export function mustProjectId(req: NextApiRequest): number {
  const fromCookie = getProjectCookie(req)
  if (fromCookie !== -1) return fromCookie

  const header = req.headers['X-Vela-Project-Id']
  if (!header) {
    throw new Error('Project id not found')
  }

  if (typeof header !== 'string') {
    throw new Error('Project id is not a string')
  }

  try {
    console.log('header', header)
    return parseInt(header)
  } catch (e) {
    throw new Error('Project id is not a number')
  }
}

export function setOrganizationCookie(organizationId: number) {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-organization-id=${organizationId}`
}

export function getOrganizationCookie(req?: NextApiRequest): number {
  let cookie: string | undefined = undefined;
  if (typeof document !== 'undefined') {
    const entry = document.cookie.split(';').find(c => c.trim().startsWith('x-vela-organization-id='))
    if (entry) cookie = entry.split('=')[1]
  }
  if (req) {
    cookie = req.cookies['x-vela-organization-id']
  }
  if (!cookie) return -1
  return parseInt(cookie)
}

export function deleteOrganizationCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-organization-id=`
}

export function setProjectCookie(projectId: number) {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-project-id=${projectId}`
}

export function getProjectCookie(req?: NextApiRequest): number {
  let cookie: string | undefined = undefined;
  if (typeof document !== 'undefined') {
    const entry = document.cookie.split(';').find(c => c.trim().startsWith('x-vela-project-id='))
    if (entry) cookie = entry.split('=')[1]
  }
  if (req) {
    cookie = req.cookies['x-vela-project-id']
  }
  if (!cookie) return -1
  return parseInt(cookie)
}

export function deleteProjectCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-project-id=`
}
