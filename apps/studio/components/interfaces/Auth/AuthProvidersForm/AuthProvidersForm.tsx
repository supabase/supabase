import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
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
        {authConfig?.EXTERNAL_EMAIL_ENABLED && authConfig?.MAILER_OTP_EXP > 3600 && (
          <Alert_Shadcn_
            className="flex w-full items-center justify-between my-3"
            variant="warning"
          >
            <WarningIcon />
            <div>
              <AlertTitle_Shadcn_>OTP expiry exceeds recommended threshold</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                <p>
                  We have detected that you have enabled the email provider with the OTP expiry set
                  to more than an hour. It is recommended to set this value to less than an hour.
                </p>
                <Button asChild type="default" className="w-min" icon={<ExternalLink size={14} />}>
                  <Link href="https://supabase.com/docs/guides/platform/going-into-prod#security">
                    View security recommendations
                  </Link>
                </Button>
              </AlertDescription_Shadcn_>
            </div>
          </Alert_Shadcn_>
        )}
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
            <WarningIcon />
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
