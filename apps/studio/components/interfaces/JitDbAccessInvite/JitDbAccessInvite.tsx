import { useIsLoggedIn, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  InterstitialAccountRow,
  InterstitialLayout,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import CopyButton from '@/components/ui/CopyButton'
import { useJitDbAccessInviteAcceptMutation } from '@/data/jit-db-access/jit-db-access-invite-accept-mutation'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useProfile, useProfileNameAndPicture } from '@/lib/profile'

function extractGrantedRoles(data: unknown): string[] {
  const normalizeArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return []
    return arr
      .map((entry) => {
        if (typeof entry === 'string') return entry
        if (entry && typeof entry === 'object') {
          const obj = entry as Record<string, unknown>
          if (typeof obj.role === 'string') return obj.role
          if (typeof obj.name === 'string') return obj.name
        }
        return null
      })
      .filter((role): role is string => !!role)
  }

  if (Array.isArray(data)) return normalizeArray(data)
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>
  for (const key of ['roles', 'user_roles', 'granted_roles', 'role_grants']) {
    const fromKey = normalizeArray(obj[key])
    if (fromKey.length > 0) return fromKey
  }
  return []
}

function buildConnectionString(role: string, projectRef: string) {
  const domain = process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN ?? 'supabase.co'
  return `postgres://${role}@db.${projectRef}.${domain}:5432/postgres?sslmode=require`
}

export const JitDbAccessInvite = () => {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const { isLoading: isLoadingProfile } = useProfile()
  const { username, avatarUrl, primaryEmail } = useProfileNameAndPicture()
  const { ref, token } = useParams()

  const isSignUpEnabled = useIsFeatureEnabled('dashboard_auth:sign_up')

  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [grantedRoles, setGrantedRoles] = useState<string[] | null>(null)

  const loginRedirectLink = `/sign-in?returnTo=${encodeURIComponent(
    `/join?token=${token ?? ''}&ref=${ref ?? ''}&type=temporary-access`
  )}`
  const signupRedirectLink = `/sign-up?returnTo=${encodeURIComponent(
    `/join?token=${token ?? ''}&ref=${ref ?? ''}&type=temporary-access`
  )}`

  const { mutate: acceptInvite, isPending: isAccepting } = useJitDbAccessInviteAcceptMutation({
    onSuccess: (data) => {
      const roles = extractGrantedRoles(data)
      if (roles.length === 0) console.debug('JIT accept response (no roles extracted):', data)
      setGrantedRoles(roles)
    },
    onError: (error) => {
      setAcceptError(error.message)
    },
  })

  const handleAcceptInvite = () => {
    setAcceptError(null)
    if (!ref) return setAcceptError('Missing project reference in the invitation link.')
    if (!token) return setAcceptError('Missing token in the invitation link.')
    if (!primaryEmail) return setAcceptError('Could not determine your account email.')
    acceptInvite({ projectRef: ref, email: primaryEmail, token })
  }

  const isAccepted = grantedRoles !== null
  const withLayout = (children: ReactNode) => (
    <InterstitialLayout
      logo={<SupabaseLogo />}
      title={isAccepted ? 'Invitation accepted' : "You've been invited"}
      description={
        isAccepted
          ? 'Use the connection string below to access the database with your granted role.'
          : "You've been invited to temporary database access on a Supabase project."
      }
      titleClassName="text-xl"
    >
      <div className="px-6 pb-6">{children}</div>
    </InterstitialLayout>
  )

  if (!router.isReady || isLoadingProfile) {
    return withLayout(
      <div className="flex flex-col gap-6">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 border-none px-4 py-3">
            <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmeringLoader className="h-3 w-20 py-0" />
              <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <ShimmeringLoader className="h-10 w-full py-0" />
          <ShimmeringLoader className="h-10 w-full py-0" />
        </div>
      </div>
    )
  }

  if (!ref || !token) {
    return withLayout(
      <Admonition
        type="warning"
        description="This invitation link is missing required information. Ask the sender for a new link."
      />
    )
  }

  if (!isLoggedIn) {
    return withLayout(
      <div className="flex flex-col gap-2">
        <Button asChild type="primary" block>
          <Link href={loginRedirectLink}>Sign in</Link>
        </Button>
        {isSignUpEnabled && (
          <Button asChild type="default" block>
            <Link href={signupRedirectLink}>Create an account</Link>
          </Button>
        )}
      </div>
    )
  }

  if (isAccepted) {
    const rolesToShow = grantedRoles && grantedRoles.length > 0 ? grantedRoles : null

    return withLayout(
      <div className="flex flex-col gap-6">
        {rolesToShow ? (
          <div className="flex flex-col gap-4">
            {rolesToShow.map((role) => {
              const connectionString = buildConnectionString(role, ref)
              return (
                <div key={role} className="flex flex-col gap-2">
                  <p className="text-sm text-foreground">
                    Role <code className="text-code-inline">{role}</code>
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 truncate rounded border border-default bg-surface-100 px-3 py-2 text-xs text-foreground"
                      title={connectionString}
                    >
                      {connectionString}
                    </code>
                    <CopyButton text={connectionString} type="default" iconOnly />
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-foreground-lighter">
              Connect with your existing database client using a Personal Access Token (PAT). The
              connection respects any IP restrictions or expiry set on the invitation.
            </p>
          </div>
        ) : (
          <Admonition
            type="default"
            description="Invitation accepted. You now have temporary database access on this project."
          />
        )}

        <Button asChild type="default" block>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  return withLayout(
    <div className="flex flex-col gap-6">
      <InterstitialAccountRow avatarUrl={avatarUrl} displayName={primaryEmail ?? username ?? ''} />

      {acceptError && <Admonition type="destructive" description={acceptError} />}

      <div className="flex flex-col gap-2">
        <Button
          type="primary"
          block
          loading={isAccepting}
          disabled={isAccepting}
          onClick={handleAcceptInvite}
        >
          Accept invite
        </Button>
        <Button asChild type="text" block>
          <Link href="/projects">Decline</Link>
        </Button>
      </div>
    </div>
  )
}
