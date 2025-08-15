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
  const fromCookie = getOrganizationCookie()
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

export function setOrganizationCookie(organizationId: number) {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-organization-id=${organizationId}`
}

export function getOrganizationCookie(): number {
  if (typeof document === 'undefined') return -1
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('x-vela-organization-id='))
  if (!cookie) return -1
  return parseInt(cookie.split('=')[1])
}
