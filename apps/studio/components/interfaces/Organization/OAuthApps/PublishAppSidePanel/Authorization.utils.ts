export interface AuthorizationToggleState {
  checked: boolean
  locked: boolean
  confirmed: boolean
}

export function getAuthorizationPreviewExplanation(
  isMemberBoundGrant: boolean,
  isProjectScopingEnabled: boolean
): string | null {
  if (isMemberBoundGrant && isProjectScopingEnabled) {
    return 'After you confirm, each member approves your app and picks which of their projects it can reach. It can do only what they can already do there.'
  }
  if (isMemberBoundGrant) {
    return 'After you confirm, each member approves your app themselves. It can do only what that member can already do, across every project they can access.'
  }
  if (isProjectScopingEnabled) {
    return 'After you confirm, an organization owner approves your app and picks which projects it can reach.'
  }
  return null
}

export function getResultingGrantDescription(
  isMemberBoundGrant: boolean,
  isProjectScopingEnabled: boolean
): string {
  if (isMemberBoundGrant && isProjectScopingEnabled) {
    return 'One grant per member, limited to chosen projects.'
  }
  if (isMemberBoundGrant) {
    return 'One grant per member, organization-wide.'
  }
  if (isProjectScopingEnabled) {
    return 'One organization grant, limited to chosen projects.'
  }
  return 'Legacy behaviour, unchanged from today.'
}

export function isAuthorizationConfirmationPending(
  memberBoundGrant: AuthorizationToggleState,
  projectScoping: AuthorizationToggleState
): boolean {
  const isPending = (toggle: AuthorizationToggleState) =>
    toggle.checked && !toggle.locked && !toggle.confirmed

  return isPending(memberBoundGrant) || isPending(projectScoping)
}
