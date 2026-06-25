import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TemporaryAccessStatusBadge } from '@/components/interfaces/TemporaryAccess/TemporaryAccessStatusBadge'
import { InlineLink } from '@/components/ui/InlineLink'
import { useMyTemporaryAccessGrantsQuery } from '@/data/jit-db-access/use-my-temporary-access-grants-query'
import { DOCS_URL } from '@/lib/constants'

export function MyAccessSection() {
  const isJitDbAccessEnabled = useIsJitDbAccessEnabled()
  const { grants, isLoading } = useMyTemporaryAccessGrantsQuery({
    enabled: isJitDbAccessEnabled,
  })

  if (!isJitDbAccessEnabled) {
    return (
      <Admonition
        type="note"
        title="Temporary access preview"
        description="Enable the Temporary access feature preview from your account menu to view database access grants here."
      />
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  const activeGrants = grants.filter((grant) => grant.status.active > 0)
  const expiredGrants = grants.filter(
    (grant) => grant.status.expired > 0 && grant.status.active === 0
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-foreground-light">
          Temporary Postgres access granted by your organization admins. Use a{' '}
          <InlineLink href="/account/tokens/scoped">scoped access token</InlineLink> as your
          database password when connecting.{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/temporary-access`}>Learn more</InlineLink>
        </p>
      </div>

      {grants.length === 0 && (
        <Admonition
          type="default"
          title="No temporary database access"
          description="When an admin grants you temporary Postgres access, it will appear here with connection details."
        />
      )}

      {activeGrants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Active access</h3>
          {activeGrants.map((grant) => (
            <Card key={grant.projectRef}>
              <CardContent className="space-y-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{grant.projectName}</p>
                    <p className="text-xs text-foreground-lighter">{grant.orgName}</p>
                  </div>
                  <TemporaryAccessStatusBadge status={grant.status} />
                </div>
                <ul className="space-y-2 text-sm">
                  {grant.userRoles.map((role) => (
                    <li key={role.role} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <code className="text-code-inline">{role.role}</code>
                      {role.expires_at ? (
                        <span className="text-foreground-lighter">
                          expires{' '}
                          <TimestampInfo
                            utcTimestamp={new Date(role.expires_at * 1000).toISOString()}
                            labelFormat="DD MMM, HH:mm"
                          />
                        </span>
                      ) : (
                        <span className="text-foreground-lighter">no expiry</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="default" size="tiny">
                    <Link href={`/project/${grant.projectRef}`}>Open project</Link>
                  </Button>
                  <Button asChild variant="default" size="tiny" icon={<ExternalLink size={14} />}>
                    <Link href="/account/tokens/scoped">Create scoped token</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {expiredGrants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Expired access</h3>
          {expiredGrants.map((grant) => (
            <Card key={grant.projectRef}>
              <CardContent className="space-y-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{grant.projectName}</p>
                  <TemporaryAccessStatusBadge status={grant.status} />
                </div>
                <p className="text-sm text-foreground-lighter">
                  Access expired
                  {grant.userRoles[0]?.expires_at
                    ? ` on ${dayjs(grant.userRoles[0].expires_at * 1000).format('DD MMM YYYY, h:mma')}`
                    : ''}
                  . Contact your organization admin to request renewed access.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
