import { Sha256 } from '@aws-crypto/sha256-browser'
import type { NextRouter } from 'next/router'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { User } from 'types'

export interface TelemetryProps {
  language: string
  search?: string
  user_agent?: string
  viewport_height?: number
  viewport_width?: number
}

/**
 * Sends a telemetry event to Logflare for tracking by the product team.
 */
const sendEvent = (
  event: {
    category: string
    action: string
    label: string
    value?: string
  },
  phProps: TelemetryProps,
  router: NextRouter
) => {
  if (!IS_PLATFORM) return

  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  const { category, action, label, value } = event

  // remove # section from router.asPath as it
  // often includes sensitive information
  // such as access/refresh tokens
  const page_location = router.asPath.split('#')[0]

  return post(
    `${API_URL}/telemetry/event`,
    {
      action: action,
      page_url: document?.location.href,
      page_title: document?.title,
      pathname: page_location,
      ph: {
        referrer: document?.referrer,
        ...phProps,
      },
      custom_properties: {
        category,
        label,
        value,
      },
    },
    {
      credentials: 'include',
    }
  )
}

/**
 * Sends a request to the telemetry endpoint to identify the user.
 * This is used when the user logs in.
 */
const sendIdentify = (user: User, pathname: string) => {
  if (!IS_PLATFORM) return

  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  const organization_slug =
    pathname.match(/\/dashboard\/org\/([^\/]+)\//) ??
    localStorage.getItem(LOCAL_STORAGE_KEYS.RECENTLY_VISITED_ORGANIZATION)
  const project_ref = pathname.match(/\/dashboard\/project\/([^\/]+)\//)

  return post(
    `${API_URL}/telemetry/identify`,
    {
      user_id: user.gotrue_id,
      ...(!!organization_slug && { organization_slug: organization_slug[1] }),
      ...(!!project_ref && { project_ref: project_ref[1] }),
    },
    {
      credentials: 'include',
    }
  )
}

/**
 * Sends a request to the telemetry endpoint to reset the user's identity, organization and group.
 * This is used when the user logs out.
 */
const sendReset = () => {
  if (!IS_PLATFORM) return
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return

  return post(`${API_URL}/telemetry/reset`, {}, { credentials: 'include' })
}

/**
 * Sends a request to the telemetry endpoint to identify the group/groups the user is working in.
 * This is used when the user navigates to a new organization or project.
 */
const sendGroupIdentify = ({
  organizationSlug,
  projectRef,
}: {
  organizationSlug?: string
  projectRef?: string
}) => {
  if (!IS_PLATFORM) return
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return
  if (!organizationSlug && !projectRef) return
  return post(
    `${API_URL}/telemetry/group/identify`,
    {
      ...(!!organizationSlug && { organization_slug: organizationSlug }),
      ...(!!projectRef && { project_ref: projectRef }),
    },
    {
      credentials: 'include',
    }
  )
}

/**
 * Sends a request to the telemetry endpoint to reset the group/groups the user is working in.
 * This is used when the user navigates to a new organization or project.
 */

const sendGroupReset = ({ resetOrganization = false, resetProject = false }) => {
  if (!IS_PLATFORM) return
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  if (consent !== 'true') return
  if (!resetOrganization && !resetProject) return
  return post(
    `${API_URL}/telemetry/group/reset`,
    {
      ...(!!resetOrganization && { reset_organization: resetOrganization }),
      ...(!!resetProject && { reset_project: resetProject }),
    },
    {
      credentials: 'include',
    }
  )
}

/**
 * Generates a unique identifier for an anonymous user based on their gotrue id.
 */
export const getAnonId = async (id: string) => {
  const hash = new Sha256()
  hash.update(id)
  const u8Array = await hash.digest()
  const binString = Array.from(u8Array, (byte) => String.fromCodePoint(byte)).join('')
  const b64encoded = btoa(binString)
  return b64encoded
}

const Telemetry = {
  sendEvent,
  sendIdentify,
  sendReset,
  sendGroupIdentify,
  sendGroupReset,
}

export default Telemetry
