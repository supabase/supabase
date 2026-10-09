import { capitalize } from 'lodash'

import { OAuthScope } from '@/data/oauth-apps/types'

export const CONSENT_COPY = {
  allProjectsOption: 'All current and future projects',
  selectionRequired: 'Must select at least one project to authorize.',
  maxProjectsReached: 'Maximum reached. Deselect a project to choose a different one.',
  organizationBoundGrant: {
    title: 'Want this scoped to one member?',
    description: (appName: string) =>
      `Have them authorize ${appName} from their own account. Authorizing here gives it your Administrator access on every project, including ones created later.`,
  },
  coversEveryProject: {
    title: 'This grant covers every project',
    description: (appName: string, organizationSlug: string) =>
      `${appName} can reach every project in ${organizationSlug}, including ones created later.`,
  },
  noProjects: {
    title: (organizationSlug: string) => `No projects in ${organizationSlug}`,
    body: (appName: string) =>
      `${appName} needs access to at least one project, and this organization doesn't have any yet.`,
    prompt: 'Expecting to see your projects?',
  },
  roleFailure: {
    title: (count: number) =>
      count === 1 ? "Couldn't authorize 1 project" : `Couldn't authorize ${count} projects`,
    description: (appName: string) =>
      `${appName} needs write access but your role is read-only on the projects highlighted. Deselect them to continue.`,
  },
  roleFailureAllProjects: {
    title: (appName: string) => `Couldn't authorize ${appName}`,
    description: (orgName: string) =>
      `Your Read-only role in ${orgName} can't grant write access. Ask an admin to change your role, or switch organization.`,
  },
} as const

export function groupScopesByLevel(scopes: OAuthScope[]) {
  const read = new Set<string>()
  const write = new Set<string>()
  const readWrite = new Set<string>()

  for (const scope of scopes) {
    const [permission, level] = scope.split(':')
    if (level === 'read') {
      read.add(permission)
    }
    if (level === 'write') {
      write.add(permission)
    }
  }

  for (const permission of write) {
    if (read.has(permission)) {
      readWrite.add(permission)
      write.delete(permission)
      read.delete(permission)
    }
  }

  return [
    ...(readWrite.size > 0
      ? [
          {
            level: 'read-write' as const,
            permissions: Array.from(readWrite),
          },
        ]
      : []),
    ...(write.size > 0
      ? [
          {
            level: 'write' as const,
            permissions: Array.from(write),
          },
        ]
      : []),
    ...(read.size > 0
      ? [
          {
            level: 'read' as const,
            permissions: Array.from(read),
          },
        ]
      : []),
  ]
}

export function formatPermissionName(name: string) {
  return name
    .split('_')
    .map((part) => capitalize(part))
    .join(' ')
}

export function getScopeLevelLabel(level: 'read' | 'write' | 'read-write') {
  if (level === 'read') return 'READ'
  if (level === 'write') return 'WRITE'
  return 'READ-WRITE'
}
