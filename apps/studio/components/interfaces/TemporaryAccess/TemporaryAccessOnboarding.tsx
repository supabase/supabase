import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import type { TemporaryAccessProjectGrant } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.types'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

type TemporaryAccessOnboardingProps = {
  organizationName: string
  grants: TemporaryAccessProjectGrant[]
}

export function TemporaryAccessOnboarding({
  organizationName,
  grants,
}: TemporaryAccessOnboardingProps) {
  const router = useRouter()

  return (
    <InterstitialLayout
      logo={<SupabaseLogo />}
      title="Your temporary database access is ready"
      description={`You've joined ${organizationName}. An admin has granted you temporary Postgres access.`}
    >
      <div className="space-y-4 px-6 pb-6">
        <Admonition
          type="default"
          title="Connect with a scoped access token"
          description={
            <>
              Create a scoped access token and use it as your database password when connecting. See{' '}
              <InlineLink href={`${DOCS_URL}/guides/platform/temporary-access`}>
                temporary access docs
              </InlineLink>{' '}
              for details.
            </>
          }
        />

        <ul className="space-y-3 text-sm">
          {grants.map((grant) => (
            <li key={grant.projectRef} className="rounded-md border px-4 py-3">
              <p className="font-medium">{grant.projectName}</p>
              <ul className="mt-2 space-y-1 text-foreground-light">
                {grant.userRoles.map((role) => (
                  <li key={role.role}>
                    <code className="text-code-inline">{role.role}</code>
                  </li>
                ))}
              </ul>
              <Button asChild variant="default" size="tiny" className="mt-3">
                <Link href={`/project/${grant.projectRef}`}>Open project</Link>
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button asChild variant="primary" block>
            <Link href="/account/tokens/scoped">Create scoped access token</Link>
          </Button>
          <Button asChild variant="default" block>
            <Link href="/account/access">View My access</Link>
          </Button>
          <Button variant="text" block onClick={() => router.push('/organizations')}>
            Go to organizations
          </Button>
        </div>
      </div>
    </InterstitialLayout>
  )
}
