export const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner:
    'Full access to the organization and all projects, including billing, organization settings, and managing members.',
  Administrator:
    'Full access to projects and members, including pausing and deleting projects. Cannot change organization settings or add owners.',
  Developer:
    'Read and write project data, but cannot change project settings, manage members, or delete projects.',
  'Read-only': 'Read-only access to the organization and all projects. Cannot make any changes.',
}
