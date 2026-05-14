import { useIsLoggedIn, useParams } from 'common'
import { Terminal } from 'lucide-react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, type ReactNode } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import {
  InterstitialAccountRow,
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import CopyButton from '@/components/ui/CopyButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { createCliLoginSession } from '@/data/cli/login'
import { withAuth } from '@/hooks/misc/withAuth'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfile } from '@/lib/profile'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize CLI', brand: 'Supabase' })

const CliLogo = () => (
  <LogoBox className="bg-black">
    <Terminal className="size-6 text-white" strokeWidth={2} />
  </LogoBox>
)

const CliLoginInterstitial = ({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) => (
  <InterstitialLayout
    logo={<LogoPair left={<CliLogo />} right={<SupabaseLogo />} />}
    title={title}
    description={description}
  >
    <div className="px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

const CliLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { session_id, public_key, token_name, device_code } = useParams()
  const isLoggedIn = useIsLoggedIn()

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <CliLoginScreen
        isLoggedIn={isLoggedIn}
        routerReady={router.isReady}
        sessionId={session_id}
        publicKey={public_key}
        tokenName={token_name}
        deviceCode={device_code}
        navigate={(destination) => router.push(destination)}
      />
    </>
  )
}

type CliLoginStatus =
  | { _tag: 'loading' }
  | { _tag: 'ready'; deviceCode: string }
  | { _tag: 'missing-params'; missingParameters: string[] }
  | { _tag: 'error'; message?: string }

export const CliLoginScreen = ({
  isLoggedIn,
  routerReady,
  sessionId,
  publicKey,
  tokenName,
  deviceCode,
  navigate,
}: {
  isLoggedIn: boolean
  routerReady: boolean
  sessionId?: string
  publicKey?: string
  tokenName?: string
  deviceCode?: string
  navigate: (destination: string) => void
}) => {
  const { profile } = useProfile()
  const [status, setStatus] = useState<CliLoginStatus>({ _tag: 'loading' })
  const displayName = profile?.primary_email ?? profile?.username

  useEffect(() => {
    if (!isLoggedIn || !routerReady) return
    if (deviceCode) {
      setStatus({ _tag: 'ready', deviceCode })
      return
    }

    const missingParameters = [
      !sessionId ? 'session_id' : undefined,
      !publicKey ? 'public_key' : undefined,
    ].filter(Boolean) as string[]

    if (missingParameters.length > 0) {
      setStatus({ _tag: 'missing-params', missingParameters })
      return
    }

    let isActive = true
    setStatus({ _tag: 'loading' })

    async function createSession() {
      try {
        const { nonce } = await createCliLoginSession(sessionId!, publicKey!, tokenName)

        if (!isActive) return

        if (nonce) {
          navigate(`/cli/login?device_code=${nonce.substring(0, 8)}`)
        } else {
          setStatus({ _tag: 'error', message: 'The CLI sign-in session did not return a code.' })
        }
      } catch (error: unknown) {
        if (!isActive) return
        setStatus({
          _tag: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    createSession()

    return () => {
      isActive = false
    }
  }, [deviceCode, isLoggedIn, navigate, publicKey, routerReady, sessionId, tokenName])

  if (status._tag === 'loading') {
    return (
      <CliLoginInterstitial
        title={<ShimmeringLoader className="mx-auto h-7 w-32 max-w-full py-0" />}
        description={<ShimmeringLoader className="mx-auto h-4 w-56 max-w-full py-0" />}
      >
        <div className="flex flex-col gap-5">
          <Card className="shadow-none">
            <CardContent className="flex items-center gap-3 border-none px-4 py-3">
              <ShimmeringLoader className="size-8 flex-shrink-0 rounded-full py-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmeringLoader className="h-3 w-20 py-0" />
                <ShimmeringLoader className="h-4 w-40 max-w-full py-0" />
              </div>
            </CardContent>
          </Card>
          <ShimmeringLoader className="h-20 w-full rounded-lg py-0" />
        </div>
      </CliLoginInterstitial>
    )
  }

  if (status._tag === 'missing-params') {
    const isPlural = status.missingParameters.length > 1

    return (
      <CliLoginInterstitial
        title="Missing sign-in parameters"
        description="This Supabase CLI sign-in request cannot be authorized"
      >
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            description={`Open the browser sign-in flow from Supabase CLI again. The URL is missing parameter${
              isPlural ? 's' : ''
            }: ${status.missingParameters.join(', ')}.`}
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </CliLoginInterstitial>
    )
  }

  if (status._tag === 'error') {
    return (
      <CliLoginInterstitial
        title="Unable to create CLI sign-in"
        description="Retry the sign-in command from Supabase CLI"
      >
        <div className="flex flex-col gap-3">
          <Admonition
            type="warning"
            description={
              <>
                Supabase could not create the CLI sign-in session.
                {status.message && (
                  <span className="mt-1 block text-foreground-lighter">
                    Error: {status.message}
                  </span>
                )}
              </>
            }
          />
          <Button type="default" block asChild>
            <Link href="/organizations">Back to dashboard</Link>
          </Button>
        </div>
      </CliLoginInterstitial>
    )
  }

  return (
    <CliLoginInterstitial
      title="Authorize Supabase CLI"
      description="Enter this verification code in Supabase CLI to finish signing in"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <div
            aria-label={`Verification code ${status.deviceCode}`}
            className="flex w-full select-text items-center font-sans text-xl text-foreground"
            onCopy={(event) => {
              event.preventDefault()
              event.clipboardData.setData('text/plain', status.deviceCode)
            }}
          >
            {Array.from(status.deviceCode.padEnd(8, ' ')).map((character, index) => (
              <span
                key={index}
                className="flex h-11 flex-1 cursor-text select-text items-center justify-center border-y border-r border-input first:rounded-l-md first:border-l last:rounded-r-md"
              >
                {character}
              </span>
            ))}
          </div>
          <CopyButton
            text={status.deviceCode}
            copyLabel="Copy code"
            copiedLabel="Copied"
            type="primary"
            size="tiny"
            className="w-full"
          />
        </div>

        <InterstitialAccountRow displayName={displayName} />

        <p className="text-center text-xs text-foreground-lighter text-balance">
          After authorizing, you can close this tab or manage tokens like this one in{' '}
          <InlineLink href="/account/tokens">Access Tokens</InlineLink>.
        </p>
      </div>
    </CliLoginInterstitial>
  )
}

export default withAuth(CliLoginPage)
