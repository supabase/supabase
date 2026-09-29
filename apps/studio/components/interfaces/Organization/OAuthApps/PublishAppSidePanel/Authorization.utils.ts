export interface AuthorizationToggleState {
  checked: boolean
  locked: boolean
  confirmed: boolean
}

export const AUTHORIZATION_COPY = {
  sectionTitle: 'Authorization',
  sectionDescription: 'How your app is granted access when someone connects it',
  memberBoundGrant: {
    label: 'Use the permissions of the person who connects',
    description:
      'Each member who connects gets their own grant, limited to what they can already do. When off, an owner approves one organization-wide grant.',
    warningBody:
      'Existing connections keep working. Only new connections will use per-member grants.',
  },
  projectScoping: {
    label: 'Ask for specific projects',
    description:
      'Users pick which projects your app can reach. Requests to other projects return 403. When off, your app reaches every project in the organization.',
    warningBody:
      'Make sure your app reads the returned scopes and handles denied requests before you turn this on.',
  },
  warningTitle: "This can't be turned off after you save",
  confirmationLabel: 'I understand this is permanent. I can test it on a duplicate app first',
  previewTitle: 'What your app users will see when they connect',
  previewIntro:
    'An organization owner approves your app once. It can then reach every project in their organization.',
  resultingGrantLabel: 'Resulting grant:',
} as const

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
