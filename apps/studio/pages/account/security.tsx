import dynamic from 'next/dynamic'
import { AlertCircle, ChevronRightIcon, Fingerprint, Smartphone } from 'lucide-react'

import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'

import type { NextPageWithLayout } from 'types'
import { useState } from 'react'
import { useFlag } from 'common'

const TOTPFactors = dynamic(() =>
  import('components/interfaces/Account/TOTPFactors').then((mod) => mod.TOTPFactors)
)
const WebAuthnFactors = dynamic(() =>
  import('components/interfaces/Account/WebAuthnFactors').then((mod) => mod.WebAuthnFactors)
)

const collapsibleClasses = [
  'bg-surface-100',
  'hover:bg-surface-200',
  'data-open:bg-surface-200',
  'border-default',
  'hover:border-strong data-open:border-strong',
  'data-open:pb-px col-span-12 rounded',
  '-space-y-px overflow-hidden',
  'border shadow',
  'transition',
  'hover:z-50',
]

const Security: NextPageWithLayout = () => {
  const { data, isLoading, isError, isSuccess, error } = useMfaListFactorsQuery()
  const [isAuthenticatorAppOpen, setIsAuthenticatorAppOpen] = useState(false)
  const [isWebAuthnOpen, setIsWebAuthnOpen] = useState(false)
  const enableWebAuthnMfa = useFlag('enableWebAuthnMfa')

  const verifiedFactors = data?.all.filter((factor) => factor.status === 'verified')
  const showSecuritySettings = useIsFeatureEnabled('account:show_security_settings')

  if (!showSecuritySettings) {
    return <UnknownInterface urlBack={`/account/me`} />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-0">
          <ScaffoldSectionTitle>Security</ScaffoldSectionTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer>
        <div className="space-y-4">
          {verifiedFactors?.length === 1 && (
            <Alert_Shadcn_ variant="default" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle_Shadcn_>
                We recommend configuring two{' '}
                {enableWebAuthnMfa ? 'mfa factors' : 'authenticator apps'} across different devices
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                The two {enableWebAuthnMfa ? 'mfa factors' : 'authenticator apps'} will serve as a
                backup for each other.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
          <Collapsible_Shadcn_
            open={isAuthenticatorAppOpen}
            onOpenChange={setIsAuthenticatorAppOpen}
            className={cn(collapsibleClasses)}
          >
            <CollapsibleTrigger_Shadcn_ asChild>
              <button
                type="button"
                className="group flex w-full items-center justify-between rounded py-3 px-4 md:px-6 text-foreground"
              >
                <div className="flex flex-row gap-4 items-center py-1">
                  <Smartphone strokeWidth={1.5} />
                  <span className="text-sm">Authenticator app</span>
                </div>

                <div className="flex flex-row gap-3 items-center">
                  {data ? (
                    <Badge variant={data.totp.length === 0 ? 'default' : 'brand'}>
                      {data.totp.length} app{data.totp.length === 1 ? '' : 's'} configured
                    </Badge>
                  ) : null}
                  <ChevronRightIcon
                    className={cn(
                      'transition-transform w-4 h-4 text-foreground-light',
                      isAuthenticatorAppOpen ? 'rotate-90' : 'rotate-0'
                    )}
                  />
                </div>
              </button>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="group border-t border-default text-foreground">
              <TOTPFactors
                data={data}
                isLoading={isLoading}
                isError={isError}
                isSuccess={isSuccess}
                error={error}
              />
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>

          {enableWebAuthnMfa && (
            <Collapsible_Shadcn_
              open={isWebAuthnOpen}
              onOpenChange={setIsWebAuthnOpen}
              className={cn(collapsibleClasses)}
            >
              <CollapsibleTrigger_Shadcn_ asChild>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded py-3 px-4 md:px-6 text-foreground"
                >
                  <div className="flex flex-row gap-4 items-center py-1">
                    <Fingerprint strokeWidth={1.5} />
                    <span className="text-sm">Security key</span>
                  </div>

                  <div className="flex flex-row gap-3 items-center">
                    {data ? (
                      <Badge
                        variant={
                          !!data.webauthn && data.webauthn?.length !== 0 ? 'brand' : 'default'
                        }
                      >
                        {data.webauthn?.length ?? '0'} key{data.webauthn?.length === 1 ? '' : 's'}{' '}
                        configured
                      </Badge>
                    ) : null}
                    <ChevronRightIcon
                      className={cn(
                        'transition-transform w-4 h-4 text-foreground-light',
                        isWebAuthnOpen ? 'rotate-90' : 'rotate-0'
                      )}
                    />
                  </div>
                </button>
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_ className="group border-t border-default text-foreground">
                <WebAuthnFactors
                  data={data}
                  isLoading={isLoading}
                  isError={isError}
                  isSuccess={isSuccess}
                  error={error}
                />
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          )}
        </div>
      </ScaffoldContainer>
    </>
  )
}

Security.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Security">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Security
