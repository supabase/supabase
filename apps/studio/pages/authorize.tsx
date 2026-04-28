import { useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import {
  API_AUTHORIZATION_MOCK_STATES,
  ApiAuthorizationScreen,
  getApiAuthorizationMockState,
} from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import { withAuth } from '@/hooks/misc/withAuth'
import type { NextPageWithLayout } from '@/types'

const isTemporaryMockPreviewEnabled = () => {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod') return true
  if (typeof window === 'undefined') return false

  return window.location.hostname.endsWith('.vercel.app')
}

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const routerReady = router.isReady
  const { auth_id, organization_slug } = useParams()
  const mock = isTemporaryMockPreviewEnabled()
    ? getApiAuthorizationMockState(router.query.mock)
    : undefined

  if (!routerReady) {
    return null
  }

  return (
    <>
      <Head>
        <title>Authorize API access | Supabase</title>
      </Head>
      {mock && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="warning" size="tiny" className="fixed right-3 top-3 z-50 font-mono">
              mock: {mock}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            <DropdownMenuRadioGroup
              value={mock}
              onValueChange={(value) => {
                router.replace(
                  { pathname: router.pathname, query: { ...router.query, mock: value } },
                  undefined,
                  { shallow: true }
                )
              }}
            >
              {API_AUTHORIZATION_MOCK_STATES.map((state) => (
                <DropdownMenuRadioItem key={state} value={state} className="font-mono text-xs">
                  {state}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ApiAuthorizationScreen
        auth_id={auth_id}
        organization_slug={organization_slug}
        navigate={(destination) => router.push(destination)}
        mock={mock}
      />
    </>
  )
}

export default withAuth(APIAuthorizationPage)
