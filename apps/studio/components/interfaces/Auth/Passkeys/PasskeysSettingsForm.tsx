import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  Input,
  Switch,
  useWatch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { validateRpId, validateWebAuthnOrigins } from './PasskeysSettingsForm.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import type { components } from '@/data/api'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

type GoTrueConfig = components['schemas']['GoTrueConfigResponse']

const schema = z
  .object({
    PASSKEY_ENABLED: z.boolean(),
    WEBAUTHN_RP_ID: z.string().trim(),
    WEBAUTHN_RP_DISPLAY_NAME: z.string().trim(),
    WEBAUTHN_RP_ORIGINS: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (!data.PASSKEY_ENABLED) return

    if (!data.WEBAUTHN_RP_DISPLAY_NAME) {
      ctx.addIssue({
        path: ['WEBAUTHN_RP_DISPLAY_NAME'],
        code: z.ZodIssueCode.custom,
        message: 'Relying Party Display Name is required when Passkey is enabled',
      })
    }

    let validatedRpId: string | null = null
    if (!data.WEBAUTHN_RP_ID) {
      ctx.addIssue({
        path: ['WEBAUTHN_RP_ID'],
        code: z.ZodIssueCode.custom,
        message: 'Relying Party ID is required when Passkey is enabled',
      })
    } else {
      validatedRpId = validateRpId(data.WEBAUTHN_RP_ID)
      if (validatedRpId === null) {
        ctx.addIssue({
          path: ['WEBAUTHN_RP_ID'],
          code: z.ZodIssueCode.custom,
          message:
            'Relying Party ID must be a bare domain (e.g. "example.com"). Do not include a scheme, port, or path.',
        })
      }
    }

    const origins = data.WEBAUTHN_RP_ORIGINS
    if (!origins) {
      ctx.addIssue({
        path: ['WEBAUTHN_RP_ORIGINS'],
        code: z.ZodIssueCode.custom,
        message: 'Relying Party Origins is required when Passkey is enabled',
      })
      return
    }

    const result = validateWebAuthnOrigins(origins, validatedRpId)
    if (!result.valid) {
      ctx.addIssue({
        path: ['WEBAUTHN_RP_ORIGINS'],
        code: z.ZodIssueCode.custom,
        message: result.message,
      })
    }
  })

type PasskeysSettings = z.infer<typeof schema>

function getPasskeyDefault(
  key: keyof Pick<
    PasskeysSettings,
    'WEBAUTHN_RP_ID' | 'WEBAUTHN_RP_ORIGINS' | 'WEBAUTHN_RP_DISPLAY_NAME'
  >,
  config: GoTrueConfig,
  project: { name: string } | undefined
): string {
  const siteUrl = config.SITE_URL
  switch (key) {
    case 'WEBAUTHN_RP_ID': {
      if (!siteUrl) return ''
      try {
        return new URL(siteUrl).hostname
      } catch {
        return ''
      }
    }
    case 'WEBAUTHN_RP_ORIGINS': {
      if (!siteUrl) return ''
      try {
        return new URL(siteUrl).origin
      } catch {
        return ''
      }
    }
    case 'WEBAUTHN_RP_DISPLAY_NAME': {
      return project?.name ?? ''
    }
    default:
      return ''
  }
}

function buildPasskeysFormValues(
  config: GoTrueConfig,
  project: { name: string } | undefined
): PasskeysSettings {
  const values: PasskeysSettings = {
    PASSKEY_ENABLED: config.PASSKEY_ENABLED ?? false,
    WEBAUTHN_RP_ID: config.WEBAUTHN_RP_ID || getPasskeyDefault('WEBAUTHN_RP_ID', config, project),
    WEBAUTHN_RP_DISPLAY_NAME:
      config.WEBAUTHN_RP_DISPLAY_NAME ||
      getPasskeyDefault('WEBAUTHN_RP_DISPLAY_NAME', config, project),
    WEBAUTHN_RP_ORIGINS:
      config.WEBAUTHN_RP_ORIGINS || getPasskeyDefault('WEBAUTHN_RP_ORIGINS', config, project),
  }

  return values
}

export const PasskeysSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    data: authConfig,
    isPending: isAuthConfigLoading,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isPending } = useAuthConfigUpdateMutation({
    onSuccess: () => {
      toast.success('Passkey settings updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update passkey settings: ${error?.message}`)
    },
  })

  const {
    can: canReadConfig,
    isLoading: isLoadingPermissions,
    isSuccess: isPermissionsLoaded,
  } = useAsyncCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const formValues =
    isSuccess && authConfig ? buildPasskeysFormValues(authConfig, project) : undefined

  const form = useForm<PasskeysSettings>({
    resolver: zodResolver(schema),
    defaultValues: formValues ?? {
      PASSKEY_ENABLED: false,
      WEBAUTHN_RP_ID: '',
      WEBAUTHN_RP_DISPLAY_NAME: '',
      WEBAUTHN_RP_ORIGINS: '',
    },
    values: formValues,
  })

  const onSubmit = (values: PasskeysSettings) => {
    if (!projectRef) return

    const payload: Record<string, string | boolean | null> = {
      PASSKEY_ENABLED: values.PASSKEY_ENABLED,
      WEBAUTHN_RP_ID: values.WEBAUTHN_RP_ID.trim() || null,
      WEBAUTHN_RP_DISPLAY_NAME: values.WEBAUTHN_RP_DISPLAY_NAME.trim() || null,
      WEBAUTHN_RP_ORIGINS: values.WEBAUTHN_RP_ORIGINS.trim() || null,
    }

    updateAuthConfig({ projectRef, config: payload })
  }

  const passKeysEnabled = useWatch({ control: form.control, name: 'PASSKEY_ENABLED' })

  if (isPermissionsLoaded && !canReadConfig) {
    return <NoPermission resourceText="view passkey settings" />
  }

  if (isAuthConfigLoading || isLoadingPermissions || !authConfig) {
    return <GenericSkeletonLoader />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <FormField
              control={form.control}
              name="PASSKEY_ENABLED"
              render={({ field }) => (
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Enable Passkey authentication"
                  description={
                    <>
                      Allow users to sign in using passkeys (WebAuthn) with biometrics, security
                      keys, or platform authenticators.{' '}
                      <InlineLink href={`${DOCS_URL}/guides/auth/passkeys`}>Learn more</InlineLink>
                    </>
                  }
                >
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canUpdateConfig}
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </CardContent>

          {passKeysEnabled && (
            <>
              <CardContent>
                <FormField
                  control={form.control}
                  name="WEBAUTHN_RP_DISPLAY_NAME"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Relying Party Display Name"
                      description="A human-readable name for your application shown during passkey registration."
                    >
                      <FormControl>
                        <Input {...field} placeholder="My project" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="WEBAUTHN_RP_ID"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Relying Party ID"
                      description='The domain name for your application (e.g. "example.com"). This determines which passkeys can be used.'
                    >
                      <FormControl>
                        <Input {...field} placeholder="example.com" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>
                <FormField
                  control={form.control}
                  name="WEBAUTHN_RP_ORIGINS"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Relying Party Origins"
                      description='Comma-separated list of allowed origins (e.g. "https://example.com"). HTTPS is required except for localhost. Android app origins are also accepted.'
                    >
                      <FormControl>
                        <Input {...field} placeholder="https://example.com" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
            </>
          )}

          <CardFooter className="justify-end space-x-2">
            <Button
              variant="default"
              onClick={() => form.reset(buildPasskeysFormValues(authConfig, project))}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!canUpdateConfig || !form.formState.isDirty}
              loading={isPending}
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
