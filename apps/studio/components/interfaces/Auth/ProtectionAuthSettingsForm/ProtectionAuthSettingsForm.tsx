import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boolean, number, object, string } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'

const CAPTCHA_PROVIDERS = [
  { key: 'hcaptcha', label: 'hCaptcha' },
  { key: 'turnstile', label: 'Turnstile by Cloudflare' },
]

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: boolean().required(),
  SECURITY_MANUAL_LINKING_ENABLED: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
  SECURITY_CAPTCHA_ENABLED: boolean().required(),
  SECURITY_CAPTCHA_SECRET: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: (schema) => schema.required('Must have a Captcha secret'),
  }),
  SECURITY_CAPTCHA_PROVIDER: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: (schema) =>
      schema
        .oneOf(['hcaptcha', 'turnstile'])
        .required('Captcha provider must be either hcaptcha or turnstile'),
  }),
  SESSIONS_TIMEBOX: number().min(0, 'Must be a positive number'),
  SESSIONS_INACTIVITY_TIMEOUT: number().min(0, 'Must be a positive number'),
  SESSIONS_SINGLE_PER_USER: boolean(),
  PASSWORD_MIN_LENGTH: number().min(6, 'Must be greater or equal to 6.'),
  PASSWORD_REQUIRED_CHARACTERS: string(),
  PASSWORD_HIBP_ENABLED: boolean(),
})

export const ProtectionAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update settings: ${error?.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated settings')
    },
  })
  const [hidden, setHidden] = useState(true)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const protectionForm = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      DISABLE_SIGNUP: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      SITE_URL: '',
      SECURITY_CAPTCHA_ENABLED: false,
      SECURITY_CAPTCHA_SECRET: '',
      SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
      SESSIONS_TIMEBOX: 0,
      SESSIONS_INACTIVITY_TIMEOUT: 0,
      SESSIONS_SINGLE_PER_USER: false,
      PASSWORD_MIN_LENGTH: 6,
      PASSWORD_REQUIRED_CHARACTERS: NO_REQUIRED_CHARACTERS,
      PASSWORD_HIBP_ENABLED: false,
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingConfig) {
      protectionForm.reset({
        DISABLE_SIGNUP: !authConfig.DISABLE_SIGNUP,
        EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED || false,
        SECURITY_MANUAL_LINKING_ENABLED: authConfig.SECURITY_MANUAL_LINKING_ENABLED || false,
        SITE_URL: authConfig.SITE_URL || '',
        SECURITY_CAPTCHA_ENABLED: authConfig.SECURITY_CAPTCHA_ENABLED || false,
        SECURITY_CAPTCHA_SECRET: authConfig.SECURITY_CAPTCHA_SECRET || '',
        SECURITY_CAPTCHA_PROVIDER: authConfig.SECURITY_CAPTCHA_PROVIDER || 'hcaptcha',
        SESSIONS_TIMEBOX: authConfig.SESSIONS_TIMEBOX || 0,
        SESSIONS_INACTIVITY_TIMEOUT: authConfig.SESSIONS_INACTIVITY_TIMEOUT || 0,
        SESSIONS_SINGLE_PER_USER: authConfig.SESSIONS_SINGLE_PER_USER || false,
        PASSWORD_MIN_LENGTH: authConfig.PASSWORD_MIN_LENGTH || 6,
        PASSWORD_REQUIRED_CHARACTERS:
          authConfig.PASSWORD_REQUIRED_CHARACTERS || NO_REQUIRED_CHARACTERS,
        PASSWORD_HIBP_ENABLED: authConfig.PASSWORD_HIBP_ENABLED || false,
      })
    }
  }, [authConfig, isUpdatingConfig])

  const onSubmitProtection = (values: any) => {
    const payload = { ...values }
    payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP
    // The backend uses empty string to represent no required characters in the password
    if (payload.PASSWORD_REQUIRED_CHARACTERS === NO_REQUIRED_CHARACTERS) {
      payload.PASSWORD_REQUIRED_CHARACTERS = ''
    }

    updateAuthConfig({ projectRef: projectRef!, config: payload })
  }

  if (isError) {
    return (
      <ScaffoldSection isFullWidth>
        <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
      </ScaffoldSection>
    )
  }

  if (!canReadConfig) {
    return (
      <ScaffoldSection isFullWidth>
        <NoPermission resourceText="view auth configuration settings" />
      </ScaffoldSection>
    )
  }

  if (isLoading) {
    return (
      <ScaffoldSection isFullWidth>
        <GenericSkeletonLoader />
      </ScaffoldSection>
    )
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Bot and Abuse Protection</ScaffoldSectionTitle>

      <Form_Shadcn_ {...protectionForm}>
        <form onSubmit={protectionForm.handleSubmit(onSubmitProtection)} className="space-y-4">
          <Card>
            <CardContent>
              <FormField_Shadcn_
                control={protectionForm.control}
                name="SECURITY_CAPTCHA_ENABLED"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Enable Captcha protection"
                    description="Protect authentication endpoints from bots and abuse."
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canUpdateConfig}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>

            {protectionForm.watch('SECURITY_CAPTCHA_ENABLED') && (
              <>
                <CardContent>
                  <FormField_Shadcn_
                    control={protectionForm.control}
                    name="SECURITY_CAPTCHA_PROVIDER"
                    render={({ field }) => {
                      const selectedProvider = CAPTCHA_PROVIDERS.find((x) => x.key === field.value)
                      return (
                        <FormItemLayout layout="flex-row-reverse" label="Choose Captcha Provider">
                          <FormControl_Shadcn_>
                            <Select_Shadcn_
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!canUpdateConfig}
                            >
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_ placeholder="Select provider" />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_ align="end">
                                {CAPTCHA_PROVIDERS.map((x) => (
                                  <SelectItem_Shadcn_ key={x.key} value={x.key}>
                                    {x.label}
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl_Shadcn_>
                          <InlineLink
                            href={
                              field.value === 'hcaptcha'
                                ? `${DOCS_URL}/guides/auth/auth-captcha?queryGroups=captcha-method&captcha-method=hcaptcha-1`
                                : field.value === 'turnstile'
                                  ? `${DOCS_URL}/guides/auth/auth-captcha?queryGroups=captcha-method&captcha-method=turnstile-1`
                                  : '/'
                            }
                            className="mt-2 text-xs text-foreground-light hover:text-foreground no-underline"
                          >
                            How to set up {selectedProvider?.label}?
                          </InlineLink>
                        </FormItemLayout>
                      )
                    }}
                  />
                </CardContent>

                <CardContent>
                  <FormField_Shadcn_
                    control={protectionForm.control}
                    name="SECURITY_CAPTCHA_SECRET"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Captcha secret"
                        description="Obtain this secret from the provider."
                      >
                        <FormControl_Shadcn_>
                          <div className="flex items-center gap-2">
                            <PrePostTab
                              postTab={
                                <Button
                                  type="text"
                                  className="p-0"
                                  onClick={() => setHidden(!hidden)}
                                  icon={hidden ? <Eye /> : <EyeOff />}
                                />
                              }
                            >
                              <Input_Shadcn_
                                {...field}
                                type={hidden ? 'password' : 'text'}
                                disabled={!canUpdateConfig}
                              />
                            </PrePostTab>
                          </div>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
              </>
            )}

            <CardContent>
              <FormField_Shadcn_
                control={protectionForm.control}
                name="PASSWORD_HIBP_ENABLED"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Prevent use of leaked passwords"
                    description="Rejects the use of known or easy to guess passwords on sign up or password change. "
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={field.value ? 'success' : 'default'}>
                        {field.value ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Link href={`/project/${projectRef}/auth/providers?provider=Email`}>
                        <Button type="default">Configure email provider</Button>
                      </Link>
                    </div>
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardFooter className="justify-end space-x-2">
              {protectionForm.formState.isDirty && (
                <Button type="default" onClick={() => protectionForm.reset()}>
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canUpdateConfig || isUpdatingConfig || !protectionForm.formState.isDirty}
                loading={isUpdatingConfig}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}
