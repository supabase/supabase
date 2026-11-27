export interface AuthorizationValues {
  member_bound_grant: boolean
  project_scoping: boolean
}

export interface AuthorizationValuesWithPartialGrants extends AuthorizationValues {
  allow_partial_grants: boolean
}

export interface AuthorizationChanges {
  isApproverChanged: boolean
  isProjectReachChanged: boolean
}

export interface AuthorizationChangesWithPartialGrants extends AuthorizationChanges {
  isPartialGrantChanged: boolean
}

export const DEFAULT_AUTHORIZATION_VALUES: AuthorizationValues = {
  member_bound_grant: false,
  project_scoping: false,
}

export const DEFAULT_AUTHORIZATION_VALUES_WITH_PARTIAL_GRANTS: AuthorizationValuesWithPartialGrants =
  {
    member_bound_grant: false,
    project_scoping: false,
    allow_partial_grants: false,
  }

export function getResultingGrantDescription(
  isMemberBoundGrant: boolean,
  isProjectScopingEnabled: boolean,
  isPartialGrantChanged?: boolean
): string {
  if (isMemberBoundGrant && isProjectScopingEnabled && isPartialGrantChanged) {
    return 'One grant per member, projects chosen when connecting, allowing partial permissions'
  }
  if (isMemberBoundGrant && isProjectScopingEnabled) {
    return 'One grant per member, projects chosen when connecting'
  }
  if (isMemberBoundGrant && isPartialGrantChanged) {
    return 'One grant per member, every project that member can access, allowing partial permissions'
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
  savedValues: AuthorizationValues | AuthorizationValuesWithPartialGrants,
  nextValues: AuthorizationValues | AuthorizationValuesWithPartialGrants,
  withOAuthAppPartialGrants: boolean = false
): AuthorizationChanges | AuthorizationChangesWithPartialGrants {
  if (withOAuthAppPartialGrants) {
    return {
      isApproverChanged: !savedValues.member_bound_grant && nextValues.member_bound_grant,
      isProjectReachChanged: !savedValues.project_scoping && nextValues.project_scoping,
      isPartialGrantChanged:
        !(savedValues as AuthorizationValuesWithPartialGrants).allow_partial_grants &&
        (nextValues as AuthorizationValuesWithPartialGrants).allow_partial_grants,
    }
  }
  return {
    isApproverChanged: !savedValues.member_bound_grant && nextValues.member_bound_grant,
    isProjectReachChanged: !savedValues.project_scoping && nextValues.project_scoping,
  }
}

export function hasAuthorizationChanges(
  changes: AuthorizationChanges,
  withOAuthAppPartialGrants: false
): boolean
export function hasAuthorizationChanges(
  changes: AuthorizationChangesWithPartialGrants,
  withOAuthAppPartialGrants: true
): boolean
export function hasAuthorizationChanges(
  changes: AuthorizationChanges | AuthorizationChangesWithPartialGrants,
  withOAuthAppPartialGrants: boolean
): boolean
export function hasAuthorizationChanges(
  changes: AuthorizationChanges | AuthorizationChangesWithPartialGrants,
  withOAuthAppPartialGrants: boolean = false
): boolean {
  if (withOAuthAppPartialGrants === true) {
    return (
      changes.isApproverChanged ||
      changes.isProjectReachChanged ||
      (changes as AuthorizationChangesWithPartialGrants).isPartialGrantChanged
    )
  }

  return changes.isApproverChanged || changes.isProjectReachChanged
}

export function getAuthorizationChangeDescriptions(
  changes: AuthorizationChanges | AuthorizationChangesWithPartialGrants
): string[] {
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
  if ((changes as AuthorizationChangesWithPartialGrants).isPartialGrantChanged) {
    descriptions.push(
      'People without all the requested permissions will be able to authorize your app. Make sure your app reads the returned scopes.'
    )
  }

  return descriptions
}
