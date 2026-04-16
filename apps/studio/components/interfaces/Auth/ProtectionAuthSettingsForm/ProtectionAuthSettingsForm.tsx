import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import NoPermission from '@/components/ui/NoPermission'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'

const CAPTCHA_PROVIDERS = [
  { key: 'hcaptcha', label: 'hCaptcha' },
  { key: 'turnstile', label: 'Turnstile by Cloudflare' },
]

type CaptchaProviders = 'hcaptcha' | 'turnstile'

const baseSchema = z.object({
  DISABLE_SIGNUP: z.boolean(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: z.boolean(),
  SECURITY_MANUAL_LINKING_ENABLED: z.boolean(),
  SITE_URL: z.string().min(1, 'Must have a Site URL'),
  SESSIONS_TIMEBOX: z
    .preprocess(
      (val) => (val === '' || val == null ? undefined : val),
      z.coerce
        .number({
          required_error: 'Must have a sessions timebox',
          invalid_type_error: 'Must have a sessions timebox',
        })
        .min(0, 'Must be greater than or equal to 0.')
    )
    .optional(),
  SESSIONS_INACTIVITY_TIMEOUT: z.number().min(0, 'Must be greater than or equal to 0').optional(),
  SESSIONS_SINGLE_PER_USER: z.boolean().optional(),
  PASSWORD_MIN_LENGTH: z
    .preprocess(
      (val) => (val === '' || val == null ? undefined : val),
      z.coerce
        .number({
          required_error: 'Must have a password min length',
          invalid_type_error: 'Must have a password min length',
        })
        .min(6, 'Must be greater or equal to 6.')
    )
    .optional(),
  PASSWORD_REQUIRED_CHARACTERS: z.string().optional(),
  PASSWORD_HIBP_ENABLED: z.boolean().optional(),
})

const captchaEnabledSchema = z
  .object({
    SECURITY_CAPTCHA_ENABLED: z.literal(true),
    SECURITY_CAPTCHA_SECRET: z.string().min(1, 'Must have a Captcha secret'),
    SECURITY_CAPTCHA_PROVIDER: z.enum(['hcaptcha', 'turnstile'], {
      required_error: 'Captcha provider must be either hcaptcha or turnstile',
    }),
  })
  .merge(baseSchema)

const captchaDisabledSchema = z
  .object({
    SECURITY_CAPTCHA_ENABLED: z.literal(false),
    SECURITY_CAPTCHA_SECRET: z.string().optional(),
    SECURITY_CAPTCHA_PROVIDER: z.string().optional(),
  })
  .merge(baseSchema)

const formSchema = z.discriminatedUnion('SECURITY_CAPTCHA_ENABLED', [
  captchaEnabledSchema,
  captchaDisabledSchema,
])
type FormSchema = z.infer<typeof formSchema>

export const ProtectionAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update settings: ${error?.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated settings')
    },
  })

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const protectionForm = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
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

  const { isDirty } = protectionForm.formState

  useEffect(() => {
    if (authConfig && !isUpdatingConfig) {
      const SECURITY_CAPTCHA_PROVIDER = (authConfig.SECURITY_CAPTCHA_PROVIDER ||
        'hcaptcha') as CaptchaProviders

      if (authConfig.SECURITY_CAPTCHA_ENABLED) {
        protectionForm.reset({
          DISABLE_SIGNUP: !authConfig.DISABLE_SIGNUP,
          EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED || false,
          SECURITY_MANUAL_LINKING_ENABLED: authConfig.SECURITY_MANUAL_LINKING_ENABLED || false,
          SITE_URL: authConfig.SITE_URL || '',
          SECURITY_CAPTCHA_ENABLED: authConfig.SECURITY_CAPTCHA_ENABLED,
          SECURITY_CAPTCHA_SECRET: authConfig.SECURITY_CAPTCHA_SECRET || '',
          SECURITY_CAPTCHA_PROVIDER,
          SESSIONS_TIMEBOX: authConfig.SESSIONS_TIMEBOX || 0,
          SESSIONS_INACTIVITY_TIMEOUT: authConfig.SESSIONS_INACTIVITY_TIMEOUT || 0,
          SESSIONS_SINGLE_PER_USER: authConfig.SESSIONS_SINGLE_PER_USER || false,
          PASSWORD_MIN_LENGTH: authConfig.PASSWORD_MIN_LENGTH || 6,
          PASSWORD_REQUIRED_CHARACTERS:
            authConfig.PASSWORD_REQUIRED_CHARACTERS || NO_REQUIRED_CHARACTERS,
          PASSWORD_HIBP_ENABLED: authConfig.PASSWORD_HIBP_ENABLED || false,
        })
      } else {
        protectionForm.reset({
          DISABLE_SIGNUP: !authConfig.DISABLE_SIGNUP,
          EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED || false,
          SECURITY_MANUAL_LINKING_ENABLED: authConfig.SECURITY_MANUAL_LINKING_ENABLED || false,
          SITE_URL: authConfig.SITE_URL || '',
          SECURITY_CAPTCHA_ENABLED: authConfig.SECURITY_CAPTCHA_ENABLED,
          SECURITY_CAPTCHA_SECRET: authConfig.SECURITY_CAPTCHA_SECRET || '',
          SECURITY_CAPTCHA_PROVIDER,
          SESSIONS_TIMEBOX: authConfig.SESSIONS_TIMEBOX || 0,
          SESSIONS_INACTIVITY_TIMEOUT: authConfig.SESSIONS_INACTIVITY_TIMEOUT || 0,
          SESSIONS_SINGLE_PER_USER: authConfig.SESSIONS_SINGLE_PER_USER || false,
          PASSWORD_MIN_LENGTH: authConfig.PASSWORD_MIN_LENGTH || 6,
          PASSWORD_REQUIRED_CHARACTERS:
            authConfig.PASSWORD_REQUIRED_CHARACTERS || NO_REQUIRED_CHARACTERS,
          PASSWORD_HIBP_ENABLED: authConfig.PASSWORD_HIBP_ENABLED || false,
        })
      }
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

  const SECURITY_CAPTCHA_ENABLED = useWatch({
    name: 'SECURITY_CAPTCHA_ENABLED',
    control: protectionForm.control,
  })

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (!canReadConfig) {
    return (
      <PageSection>
        <PageSectionContent>
          <NoPermission resourceText="view auth configuration settings" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Bot and Abuse Protection</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
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

              {SECURITY_CAPTCHA_ENABLED && (
                <>
                  <CardContent>
                    <FormField_Shadcn_
                      control={protectionForm.control}
                      name="SECURITY_CAPTCHA_PROVIDER"
                      render={({ field }) => {
                        const selectedProvider = CAPTCHA_PROVIDERS.find(
                          (x) => x.key === field.value
                        )
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
                            <Input {...field} reveal copy disabled={!canUpdateConfig} />
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
                      <div className="flex items-center justify-end gap-2">
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
                {isDirty && (
                  <Button type="default" onClick={() => protectionForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!canUpdateConfig || isUpdatingConfig || !isDirty}
                  loading={isUpdatingConfig}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
