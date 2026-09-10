import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
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
    SECURITY_CAPTCHA_PROVIDER: z.enum(['hcaptcha', 'turnstile']).optional(),
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
      SECURITY_CAPTCHA_ENABLED: false,
      SECURITY_CAPTCHA_SECRET: '',
      SECURITY_CAPTCHA_PROVIDER: 'hcaptcha',
      PASSWORD_HIBP_ENABLED: false,
    },
  })

  const { isDirty } = protectionForm.formState

  useEffect(() => {
    if (authConfig && !isUpdatingConfig) {
      const SECURITY_CAPTCHA_PROVIDER = (authConfig.SECURITY_CAPTCHA_PROVIDER ||
        'hcaptcha') as CaptchaProviders

      protectionForm.reset({
        SECURITY_CAPTCHA_ENABLED: authConfig.SECURITY_CAPTCHA_ENABLED,
        SECURITY_CAPTCHA_SECRET: authConfig.SECURITY_CAPTCHA_SECRET || '',
        SECURITY_CAPTCHA_PROVIDER,
        PASSWORD_HIBP_ENABLED: authConfig.PASSWORD_HIBP_ENABLED || false,
      })
    }
  }, [authConfig, isUpdatingConfig])

  const onSubmitProtection: SubmitHandler<z.infer<typeof formSchema>> = (values) => {
    updateAuthConfig({ projectRef: projectRef!, config: values })
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
        <Form {...protectionForm}>
          <form onSubmit={protectionForm.handleSubmit(onSubmitProtection)} className="space-y-4">
            <Card>
              <CardContent>
                <FormField
                  control={protectionForm.control}
                  name="SECURITY_CAPTCHA_ENABLED"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enable Captcha protection"
                      description="Protect authentication endpoints from bots and abuse."
                    >
                      <FormControl>
                        <Switch
                          aria-label="Toggle Captcha protection"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              {SECURITY_CAPTCHA_ENABLED && (
                <>
                  <CardContent>
                    <FormField
                      control={protectionForm.control}
                      name="SECURITY_CAPTCHA_PROVIDER"
                      render={({ field }) => {
                        const selectedProvider = CAPTCHA_PROVIDERS.find(
                          (x) => x.key === field.value
                        )
                        return (
                          <FormItemLayout layout="flex-row-reverse" label="Choose Captcha Provider">
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!canUpdateConfig}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                  {CAPTCHA_PROVIDERS.map((x) => (
                                    <SelectItem key={x.key} value={x.key}>
                                      {x.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
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
                    <FormField
                      control={protectionForm.control}
                      name="SECURITY_CAPTCHA_SECRET"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Captcha secret"
                          description="Obtain this secret from the provider."
                        >
                          <FormControl>
                            <Input {...field} reveal copy disabled={!canUpdateConfig} />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                </>
              )}

              <CardContent>
                <FormField
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
                          <Button variant="default">Configure in email provider</Button>
                        </Link>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {isDirty && (
                  <Button variant="default" onClick={() => protectionForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!canUpdateConfig || isUpdatingConfig || !isDirty}
                  loading={isUpdatingConfig}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
    </PageSection>
  )
}
