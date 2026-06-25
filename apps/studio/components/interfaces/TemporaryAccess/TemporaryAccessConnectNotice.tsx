import { useParams } from 'common'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { useIsJitDbAccessEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { InlineLink } from '@/components/ui/InlineLink'
import { useJitDbAccessSelfQuery } from '@/data/jit-db-access/jit-db-access-self-query'
import { DOCS_URL } from '@/lib/constants'

export function TemporaryAccessConnectNotice() {
  const { ref: projectRef } = useParams()
  const isJitDbAccessEnabled = useIsJitDbAccessEnabled()
  const { data: selfGrants } = useJitDbAccessSelfQuery(
    { projectRef },
    { enabled: isJitDbAccessEnabled && !!projectRef }
  )

  const activeRoles = useMemo(() => {
    const now = Date.now() / 1000
    return (selfGrants?.user_roles ?? []).filter(
      (role) => !role.expires_at || role.expires_at > now
    )
  }, [selfGrants?.user_roles])

  const [selectedRole, setSelectedRole] = useState<string>('')

  const resolvedRole = selectedRole || activeRoles[0]?.role || ''

  if (!isJitDbAccessEnabled || activeRoles.length === 0) return null

  return (
    <Admonition
      type="default"
      title="Temporary database access"
      description={
        <div className="space-y-3">
          <p>
            You have temporary Postgres access on this project. Use a{' '}
            <InlineLink href="/account/tokens/scoped">scoped access token</InlineLink> as your
            database password.{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/temporary-access`}>
              Learn more
            </InlineLink>
          </p>
          {activeRoles.length > 1 && (
            <div className="max-w-xs">
              <Select value={resolvedRole} onValueChange={setSelectedRole}>
                <SelectTrigger size="small">
                  <SelectValue placeholder="Select Postgres role" />
                </SelectTrigger>
                <SelectContent>
                  {activeRoles.map((role) => (
                    <SelectItem key={role.role} value={role.role}>
                      {role.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {activeRoles.length === 1 && (
            <p className="text-xs text-foreground-lighter">
              Postgres role: <code className="text-code-inline">{activeRoles[0].role}</code>
            </p>
          )}
          <p className="text-xs text-foreground-lighter">
            View all grants on your <Link href="/account/access">My access</Link> page.
          </p>
        </div>
      }
    />
  )
}
