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

  return {
    ['read-write']: Array.from(readWrite),
    ['write']: Array.from(write),
    ['read']: Array.from(read),
  }
}

export function formatPermissionName(name: string) {
  return name
    .split('_')
    .map((part) => capitalize(part))
    .join(' ')
}

export type ScopeGroupLevel = 'read' | 'write' | 'read-write'

type ScopeGroup = {
  'read-write': string[]
  write: string[]
  read: string[]
}

export type DiffScopePermission = {
  permission: string
  previousLevel: ScopeGroupLevel | undefined
}

type DiffScopeGroup = {
  'read-write': DiffScopePermission[]
  write: DiffScopePermission[]
  read: DiffScopePermission[]
  removed: DiffScopePermission[]
}

type ScopePermission = OAuthScope extends `${infer Permission}:${string}` ? Permission : never
type ScopeLevel = OAuthScope extends `${string}:${infer Level}` ? Level : never

export const getDiffBetweenScopes = ({
  scopes,
  previousScopes,
}: {
  scopes: OAuthScope[]
  previousScopes: OAuthScope[]
}) => {
  const unchanged: ScopeGroup = { 'read-write': [], write: [], read: [] }
  const changed: DiffScopeGroup = { 'read-write': [], write: [], read: [], removed: [] }

  const permissionsWithLevel = getPermissionsWithLevel(scopes)
  const previousPermissionsWithLevel = getPermissionsWithLevel(previousScopes)

  const permissionsKeys = Object.keys(permissionsWithLevel) as ScopePermission[]
  for (const permission of permissionsKeys) {
    // New permission
    if (!previousPermissionsWithLevel[permission]) {
      changed[permissionsWithLevel[permission]!].push({ permission, previousLevel: undefined })
      continue
    }

    // Updated permission
    if (permissionsWithLevel[permission] !== previousPermissionsWithLevel[permission]) {
      changed[permissionsWithLevel[permission]!].push({
        permission,
        previousLevel: previousPermissionsWithLevel[permission],
      })
      continue
    }

    // Unchanged permission
    unchanged[permissionsWithLevel[permission]].push(permission)
  }

  // Now detect removed permissions
  const previousPermissionsKeys = Object.keys(previousPermissionsWithLevel) as ScopePermission[]
  for (const permission of previousPermissionsKeys) {
    if (permissionsWithLevel[permission] == null) {
      changed.removed.push({
        permission,
        previousLevel: previousPermissionsWithLevel[permission],
      })
    }
  }

  return { unchanged, changed }
}

export const getPermissionsWithLevel = (scopes: OAuthScope[]) => {
  const scopesWithLevel: Partial<Record<ScopePermission, ScopeGroupLevel>> = {}

  for (const scope of scopes) {
    const [permission, level] = extractPermissionAndLevelFromScope(scope)

    if (!scopesWithLevel[permission]) {
      scopesWithLevel[permission] = level
    }
    if (scopesWithLevel[permission] === 'read-write') {
      continue
    }
    if (scopesWithLevel[permission] === 'read' && level === 'write') {
      scopesWithLevel[permission] = 'read-write'
      continue
    }

    if (scopesWithLevel[permission] === 'write' && level === 'read') {
      scopesWithLevel[permission] = 'read-write'
      continue
    }
  }

  return scopesWithLevel
}

export const extractPermissionAndLevelFromScope = (
  scope: OAuthScope
): [ScopePermission, ScopeLevel] => {
  const [permission, level] = scope.split(':')
  return [permission as ScopePermission, level as ScopeLevel]
}
