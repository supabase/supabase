import { Link } from '@tanstack/react-router'
import { Button } from 'ui'

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
  onRemove: (ref: string) => void
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
    <section
      className="rounded-md border bg-surface-75 px-4"
      aria-label="Projects that need changes"
    >
      <h3 className="pt-3 text-sm font-medium">Projects that need changes</h3>
      <ul className="divide-y text-xs">
        {projects.map(({ ref, name, issue }) => {
          const { description, action, to } = issueDetails[issue]
          return (
            <li key={ref} className="flex items-start justify-between gap-2 py-3">
              <div className="space-y-1">
                <span className="font-medium">{name}</span>
                <span className="block">{description}</span>
                <Link
                  className="underline"
                  to={to}
                  params={{ ref }}
                  target="_blank"
                  rel="noreferrer"
                >
                  {action}
                </Link>
              </div>
              <Button
                variant="text"
                size="tiny"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(ref)}
              >
                Remove
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
