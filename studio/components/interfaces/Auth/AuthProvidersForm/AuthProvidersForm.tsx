import { useParams } from 'common'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, IconAlertCircle } from 'ui'

import { FormHeader } from 'components/ui/Forms'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { PROVIDERS_SCHEMAS } from 'stores/authConfig/schema'
import { ProviderCollapsibleClasses } from './AuthProvidersForm.constants'
import ProviderForm from './ProviderForm'

const AuthProvidersForm = () => {
  const { ref: projectRef } = useParams()
  const {
    isLoading,
    error: authConfigError,
    isError,
    data: authConfig,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  return (
    <div>
      <FormHeader
        title="Auth Providers"
        description="Authenticate your users through a suite of providers and login methods"
      />

      <div className="-space-y-px">
        {isLoading &&
          PROVIDERS_SCHEMAS.map((provider) => (
            <div
              key={`provider_${provider.title}`}
              className={[...ProviderCollapsibleClasses, 'px-6 py-3'].join(' ')}
            >
              <HorizontalShimmerWithIcon />
            </div>
          ))}
        {isError && (
          <Alert_Shadcn_ variant="destructive">
            <IconAlertCircle strokeWidth={2} />
            <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
        {isSuccess &&
          PROVIDERS_SCHEMAS.map((provider) => {
            return (
              <ProviderForm
                key={`provider_${provider.title}`}
                config={authConfig}
                provider={provider as any}
              />
            )
          })}
      </div>
    </div>
  )
}

export default AuthProvidersForm
