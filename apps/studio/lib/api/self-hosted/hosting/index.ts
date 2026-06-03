import assert from 'node:assert'

import { assertSelfHosted } from '../util'
import { HostingAgentClient } from './hostingAgentClient'
import { FileSystemSitesStore } from './sitesStore'

export function getSitesStore() {
  assertSelfHosted()
  assert(process.env.WEB_HOSTING_ROOT, 'WEB_HOSTING_ROOT is required')

  return new FileSystemSitesStore(process.env.WEB_HOSTING_ROOT)
}

export function getHostingAgentClient() {
  assertSelfHosted()
  assert(process.env.HOSTING_AGENT_URL, 'HOSTING_AGENT_URL is required')
  assert(process.env.HOSTING_AGENT_TOKEN, 'HOSTING_AGENT_TOKEN is required')

  return new HostingAgentClient(process.env.HOSTING_AGENT_URL, process.env.HOSTING_AGENT_TOKEN)
}
