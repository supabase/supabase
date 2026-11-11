import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'

import { ThirdPartyAuthForm } from '@/components/interfaces/Auth/ThirdPartyAuthForm'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useGrant } from '@/lib/grants'
import type { NextPageWithLayout } from '@/types'

const ThirdPartyPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const integrationsGrant = useGrant('GET /v1/projects/{ref}/config/auth/third-party-auth', {
    projectRef: ref,
  })

  const showThirdPartyAuth = useIsFeatureEnabled('authentication:third_party_auth')

  if (!showThirdPartyAuth) {
    return (
      <AuthLayout title="Sign In / Providers">
        <UnknownInterface urlBack={`/project/${ref}/auth/providers`} />
      </AuthLayout>
    )
  }

  return (
    <AuthProvidersLayout>
      {integrationsGrant.status === 'denied' && (
        <NoPermission isFullPage resourceText="access your project's auth provider settings" />
      )}
      {integrationsGrant.status === 'error' && (
        <PageContainer size="default" className="pb-16">
          <AlertError
            error={integrationsGrant.error}
            subject="Failed to check auth provider settings permissions"
          />
        </PageContainer>
      )}
      {(integrationsGrant.status === 'loading' || integrationsGrant.status === 'granted') && (
        <PageContainer size="default" className="pb-16">
          <ThirdPartyAuthForm />
        </PageContainer>
      )}
    </AuthProvidersLayout>
  )
}

ThirdPartyPage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default ThirdPartyPage
