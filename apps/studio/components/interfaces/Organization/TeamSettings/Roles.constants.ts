export const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Full access, including deleting the organization and transferring or deleting projects.',
  Administrator:
    'Manage members, billing, and project settings, including deleting projects. Cannot manage organization settings or owners.',
  Developer:
    'Manage project content, including deleting data, users, files, and Edge Functions. Cannot change settings or delete projects.',
  'Read-only':
    'View resources without modifying or deleting them. SQL Editor access is limited to SELECT queries.',
}
