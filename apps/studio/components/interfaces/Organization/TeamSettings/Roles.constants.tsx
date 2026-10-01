import type { ReactNode } from 'react'

export const ROLE_DESCRIPTIONS: Record<string, ReactNode> = {
  Owner: (
    <>
      Full access, including <strong>removing you or any other owner</strong>,{' '}
      <strong>deleting the organization</strong>, and transferring or deleting projects.
    </>
  ),
  Administrator: (
    <>
      Manage members, billing, and project settings, including <strong>removing members</strong> and{' '}
      <strong>deleting projects</strong>. Cannot manage organization settings or owners.
    </>
  ),
  Developer:
    'Manage project content, including deleting data, users, files, and Edge Functions. Cannot change settings or delete projects.',
  'Read-only':
    'View resources without modifying or deleting them. SQL Editor access is limited to SELECT queries.',
}
