import { ExternalLink } from 'lucide-react'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS } from 'common'
import { FeatureBanner } from 'components/ui/FeatureBanner'
import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import {
  Card,
  CardContent,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { SupportLink } from '../Support/SupportLink'
import { ApiKeyPill } from './ApiKeyPill'
import { CreateNewAPIKeysButton } from './CreateNewAPIKeysButton'

// Mock API Keys for demo
const mockApiKeys = [
  {
    id: 'mock-id-2',
    type: 'publishable',
    api_key: 'sb_publishable_ltaNA7nnVozoSCOcZIjg',
    name: 'web',
  },
  {
    id: 'mock-id-3',
    type: 'publishable',
    api_key: 'sb_publishable_YpotEpinEWsC2dI7FIKI',
    name: 'mobile',
  },
  {
    id: 'mock-id-1',
    type: 'secret',
    api_key: 'sb_secret_8I4Se•••••••••••••',
    name: 'backend_api',
  },
] as Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>[]

/**
 * Reusable table illustration component
 */
const ApiKeysTableIllustration = () => {
  return (
    <Card className="w-full overflow-hidden opacity-60 pointer-events-none bg-surface-100">
      <CardContent className="p-0">
        <Table className="p-5">
          <TableHeader>
            <TableRow className="bg-200">
              <TableHead
                key=""
                className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 overflow-hidden w-[180px]"
              >
                Name
              </TableHead>
              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 pr-0">
                API Key
              </TableHead>
              <TableHead
                className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2"
                key="actions"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockApiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="py-2 w-[180px]">{apiKey.name}</TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-row gap-2">
                    <ApiKeyPill apiKey={apiKey} />
                  </div>
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/**
 * Reusable illustration with gradient overlay component
 */
const ApiKeysIllustrationWithOverlay = () => {
  return (
    <>
      {/* Gradient overlay - horizontal on desktop, vertical on mobile */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 xl:h-full xl:inset-x-auto xl:-right-16 xl:top-3 w-full xl:w-2/3
        bg-gradient-to-t xl:bg-gradient-to-l
        from-background-alternative via-background-alternative/90 via-[5%] to-transparent
        z-[3] pointer-events-none xl:max-w-[500px]"
      />

      <div className="absolute scale-100 left-10 -bottom-14 w-[720px] xl:w-[500px] xl:left-auto xl:-right-[200px] 2xl:-right-16 xl:top-[21px] xl:scale-75">
        <ApiKeysTableIllustration />
      </div>
    </>
  )
}

export const ApiKeysCreateCallout = () => {
  return (
    <FeatureBanner illustration={<ApiKeysIllustrationWithOverlay />} bgAlt>
      <div className="flex flex-col gap-0 z-[2]">
        <p className="text-sm text-foreground">Create API keys</p>
        <p className="text-sm text-foreground-lighter lg:max-w-sm 2xl:max-w-none">
          Use keys to authenticate requests to your app
        </p>
        <div className="mt-4">
          <CreateNewAPIKeysButton />
        </div>
      </div>
    </FeatureBanner>
  )
}

export const ApiKeysFeedbackBanner = () => {
  return (
    <FeatureBanner
      storageKey={LOCAL_STORAGE_KEYS.API_KEYS_FEEDBACK_DISMISSED}
      className="!p-0 flex flex-col gap-0"
      dismissable
    >
      <div className="p-5">
        <p className="text-sm text-foreground">Your new API keys are here</p>
        <p className="text-sm text-foreground-lighter">
          We've updated our API keys to better support your application needs.{' '}
          <InlineLink
            href="https://github.com/orgs/supabase/discussions/29260"
            className="inline-flex items-center gap-1"
          >
            Join the discussion on GitHub <ExternalLink aria-hidden size={14} strokeWidth={1.5} />
          </InlineLink>
        </p>
      </div>

      <Separator className="w-full" />

      <div className="px-5 py-2 bg-surface-200/30">
        <p className="text-sm text-foreground-lighter">
          Having trouble with the new API keys?{' '}
          <SupportLink
            className={InlineLinkClassName}
            queryParams={{
              category: SupportCategories.PROBLEM,
              subject: 'Help with API keys',
              message:
                "I'm experiencing problems with the new API keys feature. Please describe your specific issue here.",
            }}
          >
            Contact support
          </SupportLink>
        </p>
      </div>
    </FeatureBanner>
  )
}
