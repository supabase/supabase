import { Link } from '@tanstack/react-router'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { OAuthAppsAuthorizeRequest } from '@/data/oauth-apps/types'

type DatabaseAccess = NonNullable<OAuthAppsAuthorizeRequest['databaseAccess']>
type ProjectIssue = NonNullable<NonNullable<DatabaseAccess['projectIssues']>[string]>

export function DatabaseAccessProjectIssues({
  projects,
  role,
  onRemove,
}: {
  projects: { ref: string; name: string; issue: ProjectIssue }[]
  role: string
  onRemove: () => void
}) {
  const issueDetails = {
    postgres_upgrade_required: {
      description: 'Upgrade to a supported version of Postgres 17.',
      action: 'View upgrade options',
      to: '/project/$ref/settings/infrastructure',
    },
    ssl_enforcement_required: {
      description: 'Require encrypted database connections.',
      action: 'Open SSL settings',
      to: '/project/$ref/database/settings',
    },
    role_conflict: {
      description: `A database role named ${role} already exists.`,
      action: 'View database roles',
      to: '/project/$ref/database/roles',
    },
  } as const

  return (
    <Admonition type="warning" title="Fix or remove these projects to continue">
      <ul className="mb-3 list-disc space-y-1 pl-4">
        {projects.map(({ ref, name, issue }) => {
          const { description, action, to } = issueDetails[issue]
          return (
            <li key={ref}>
              <span className="font-medium">{name}</span>
              <span className="block">{description}</span>
              <Link className="underline" to={to} params={{ ref }} target="_blank" rel="noreferrer">
                {action}
              </Link>
            </li>
          )
        })}
      </ul>
      <Button variant="default" onClick={onRemove}>
        Remove blocked projects
      </Button>
    </Admonition>
  )
}
