import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { toast } from 'sonner'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
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
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'

const CAPTCHA_PROVIDERS = [
  { key: 'hcaptcha', label: 'hCaptcha' },
  { key: 'turnstile', label: 'Turnstile by Cloudflare' },
]

const schema = z.intersection(
  z.object({
    DISABLE_SIGNUP: z.boolean(),
    EXTERNAL_ANONYMOUS_USERS_ENABLED: z.boolean(),
    SECURITY_MANUAL_LINKING_ENABLED: z.boolean(),
    SITE_URL: z.string().url('Must have a Site URL'),
    SESSIONS_TIMEBOX: z.coerce.number().min(0, 'Must be a positive number'),
    SESSIONS_INACTIVITY_TIMEOUT: z.coerce.number().min(0, 'Must be a positive number'),
    SESSIONS_SINGLE_PER_USER: z.boolean(),
    PASSWORD_MIN_LENGTH: z.coerce.number().min(6, 'Must be greater or equal to 6.'),
    PASSWORD_REQUIRED_CHARACTERS: z.string().optional(),
    PASSWORD_HIBP_ENABLED: z.boolean(),
  }),
  z.discriminatedUnion(`SECURITY_CAPTCHA_ENABLED`, [
    z.object({
      SECURITY_CAPTCHA_ENABLED: z.literal(false),
    }),
    z.object({
      SECURITY_CAPTCHA_ENABLED: z.literal(true),
      SECURITY_CAPTCHA_SECRET: z.string({ required_error: 'Must have a Captcha secret' }),
      SECURITY_CAPTCHA_PROVIDER: z.union([z.literal('hcaptcha'), z.literal('turnstile')], {
        required_error: 'Captcha provider must be either hcaptcha or turnstile',
      }),
    }),
  ])
)

const ProtectionAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const [isUpdatingProtection, setIsUpdatingProtection] = useState(false)
  const [hidden, setHidden] = useState(true)

  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const protectionForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      DISABLE_SIGNUP: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      SITE_URL: '',
      SECURITY_CAPTCHA_ENABLED: false,
      SESSIONS_TIMEBOX: 0,
      SESSIONS_INACTIVITY_TIMEOUT: 0,
      SESSIONS_SINGLE_PER_USER: false,
      PASSWORD_MIN_LENGTH: 6,
      PASSWORD_REQUIRED_CHARACTERS: NO_REQUIRED_CHARACTERS,
      PASSWORD_HIBP_ENABLED: false,
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingProtection) {
      // @ts-expect-error
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
  }, [authConfig, isUpdatingProtection])

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = (values) => {
    setIsUpdatingProtection(true)
    updateAuthConfig(
      {
        projectRef: projectRef!,
        config: {
          ...values,
          DISABLE_SIGNUP: !values.DISABLE_SIGNUP,
          // The backend uses empty string to represent no required characters in the password
          // @ts-expect-error the expected type is narrower than `string`
          PASSWORD_REQUIRED_CHARACTERS:
            values.PASSWORD_REQUIRED_CHARACTERS === NO_REQUIRED_CHARACTERS
              ? ''
              : values.PASSWORD_REQUIRED_CHARACTERS,
        },
      },
      {
        onError: (error) => {
          toast.error(`Failed to update settings: ${error?.message}`)
          setIsUpdatingProtection(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated settings')
          setIsUpdatingProtection(false)
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (!canReadConfig) {
    return <NoPermission resourceText="view auth configuration settings" />
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Bot and Abuse Protection</ScaffoldSectionTitle>

      <Form_Shadcn_ {...protectionForm}>
        <form onSubmit={protectionForm.handleSubmit(onSubmit)} className="space-y-4">
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
                                ? 'https://supabase.com/docs/guides/auth/auth-captcha?queryGroups=captcha-method&captcha-method=hcaptcha-1'
                                : field.value === 'turnstile'
                                  ? 'https://supabase.com/docs/guides/auth/auth-captcha?queryGroups=captcha-method&captcha-method=turnstile-1'
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

            <CardFooter className="justify-end space-x-2">
              {protectionForm.formState.isDirty && (
                <Button type="default" onClick={() => protectionForm.reset()}>
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                disabled={
                  !canUpdateConfig || isUpdatingProtection || !protectionForm.formState.isDirty
                }
                loading={isUpdatingProtection}
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

export default ProtectionAuthSettingsForm
