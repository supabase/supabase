export interface AuthorizationValues {
  member_bound_grant: boolean
  project_scoping: boolean
}

export interface AuthorizationChanges {
  isApproverChanged: boolean
  isProjectReachChanged: boolean
}

export const DEFAULT_AUTHORIZATION_VALUES: AuthorizationValues = {
  member_bound_grant: false,
  project_scoping: false,
}

export function getResultingGrantDescription(
  isMemberBoundGrant: boolean,
  isProjectScopingEnabled: boolean
): string {
  if (isMemberBoundGrant && isProjectScopingEnabled) {
    return 'One grant per member, projects chosen when connecting'
  }
  if (isMemberBoundGrant) {
    return 'One grant per member, every project that member can access'
  }
  if (isProjectScopingEnabled) {
    return 'One grant for the organization, projects chosen when connecting'
  }
  return 'One grant for the organization, every project in it'
}

export function getAllProjectsRowLabel(
  isMemberBoundGrant: boolean,
  organizationName?: string
): string {
  if (isMemberBoundGrant) return 'All projects you can access'
  return `All projects in ${organizationName ?? 'your organization'}`
}

export function getAuthorizationChanges(
  savedValues: AuthorizationValues,
  nextValues: AuthorizationValues
): AuthorizationChanges {
  return {
    isApproverChanged: !savedValues.member_bound_grant && nextValues.member_bound_grant,
    isProjectReachChanged: !savedValues.project_scoping && nextValues.project_scoping,
  }
}

export function hasAuthorizationChanges(changes: AuthorizationChanges): boolean {
  return changes.isApproverChanged || changes.isProjectReachChanged
}

export function getAuthorizationChangeDescriptions(changes: AuthorizationChanges): string[] {
  const descriptions: string[] = []

  if (changes.isApproverChanged) {
    descriptions.push(
      'Each member will connect with their own access instead of one owner-approved grant.'
    )
  }
  if (changes.isProjectReachChanged) {
    descriptions.push(
      'People connecting will be able to limit your app to specific projects. Make sure your app reads the returned scopes and handles 403s.'
    )
  }

  return descriptions
}
