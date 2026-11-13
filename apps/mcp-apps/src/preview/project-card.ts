/**
 * Project card fixtures for `?preview=` URLs. `starting` becomes Active after a
 * few checks, so the live status can be seen without a host.
 */
import type { Project } from 'surfaces/contract'

import type { ToolViewSession } from '../host/connect'

const project: Project = {
  id: 'surfaces-preview-fixture',
  ref: 'wkqjzhxrtpmvbnslcdfa',
  name: 'Support inbox',
  status: 'COMING_UP',
  region: 'us-east-1',
  organization_id: 'org-1',
  organization_slug: 'acme',
}

export async function previewProjectCard(name: string): Promise<ToolViewSession<Project>> {
  // A project created 40 seconds before the preview loads.
  const createdAt = new Date(Date.now() - 40_000).toISOString()
  const initial =
    name === 'active'
      ? { ...project, status: 'ACTIVE_HEALTHY' }
      : { ...project, created_at: createdAt }
  let checks = 0
  return {
    initial,
    agent: {
      agentName: 'agent',
      isPreview: true,
      openLink: (url) => window.open(url, '_blank', 'noopener'),
    },
    data: {
      async getOrganization() {
        return { id: 'acme', name: 'Acme Inc' }
      },
      async getProject() {
        checks += 1
        return { ...initial, status: checks >= 3 ? 'ACTIVE_HEALTHY' : initial.status }
      },
    } as unknown as ToolViewSession<Project>['data'],
  }
}
