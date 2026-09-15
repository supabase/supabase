export const CONSENT_COPY = {
  unverifiedPublisher: "This publisher isn't verified by Supabase. Only continue if you trust it.",
  workspaceReuse:
    "Some clients may reuse one authorization across workspaces. Check your client's workspace or account settings if project access does not behave as expected.",
  dynamicClient: 'This client was registered automatically. Supabase sets its access settings.',
  allProjectsOption: 'All current and future projects',
  selectionRequired: 'Must select at least one project to authorize.',
  maxProjectsReached: 'Maximum reached. Deselect a project to choose a different one.',
  organizationBoundGrant: {
    title: 'This grant is shared with the whole organization',
    description: (appName: string, organizationSlug: string) =>
      `${appName} acts with owner permissions for every member of ${organizationSlug}, and stays active if you leave.`,
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
