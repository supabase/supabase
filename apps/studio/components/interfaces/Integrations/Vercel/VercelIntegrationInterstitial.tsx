import Link from 'next/link'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { ENV_VAR_RAW_KEYS } from './Integrations-Vercel.constants'
import { LogoPair, PartnerLogo, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import { BASE_PATH } from '@/lib/constants'

const VERCEL_ENV_VAR_COUNT = ENV_VAR_RAW_KEYS.length
const VERCEL_ICON_SRC = `${BASE_PATH}/img/icons/vercel-icon.svg`

export const VERCEL_INTEGRATION_ICON = <img src={VERCEL_ICON_SRC} alt="Vercel" className="w-4" />

export function VercelIntegrationLogo() {
  return (
    <LogoPair
      left={
        <PartnerLogo
          src={VERCEL_ICON_SRC}
          alt="Vercel"
          className="bg-surface-75"
          imageClassName="size-7 object-contain dark:invert"
        />
      }
      right={<SupabaseLogo />}
    />
  )
}

export function VercelIntegrationFooter() {
  return (
    <p className="text-xs text-foreground-lighter">
      You can remove this integration at any time from Vercel or the Supabase dashboard.
    </p>
  )
}

export function VercelEnvVarsSyncDescription() {
  return (
    <>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm font-normal text-foreground-lighter underline decoration-dotted underline-offset-2"
          >
            {VERCEL_ENV_VAR_COUNT} environment variables
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="center" className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Environment variables</h4>
            <ul className="max-h-52 space-y-1 overflow-y-auto">
              {ENV_VAR_RAW_KEYS.map((key) => (
                <li key={key} className="font-mono text-xs text-foreground-lighter">
                  {key}
                </li>
              ))}
            </ul>
          </div>
        </HoverCardContent>
      </HoverCard>{' '}
      will be synced to your Vercel project.
    </>
  )
}

interface VercelIntegrationInterstitialErrorStateProps {
  title: string
  errorMessage?: string | null
}

export function VercelIntegrationInterstitialErrorState({
  title,
  errorMessage,
}: VercelIntegrationInterstitialErrorStateProps) {
  return (
    <div className="flex flex-col gap-3">
      <Admonition
        type="warning"
        title={title}
        description={
          <>
            Retry the installation request from Vercel.
            {errorMessage && (
              <span className="mt-1 block text-foreground-lighter">Error: {errorMessage}</span>
            )}
          </>
        }
      />
      <Button variant="default" block asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  )
}
