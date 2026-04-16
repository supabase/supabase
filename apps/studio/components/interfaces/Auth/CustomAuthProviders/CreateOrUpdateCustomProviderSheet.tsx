import { zodResolver } from '@hookform/resolvers/zod'
import type { CustomOAuthProvider } from '@supabase/auth-js'
import { useParams } from 'common'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormInputGroupInput,
  Input,
  Input_Shadcn_,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  useWatch_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { FormSectionLabel } from '@/components/ui/Forms/FormSection'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useOAuthCustomProviderCreateMutation } from '@/data/oauth-custom-providers/oauth-custom-provider-create-mutation'
import {
  useOAuthCustomProviderUpdateMutation,
  type OAuthCustomProviderUpdateVariables,
} from '@/data/oauth-custom-providers/oauth-custom-provider-update-mutation'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

interface CreateOrUpdateCustomProviderSheetProps {
  visible: boolean
  providerToEdit?: CustomOAuthProvider
  onClose: () => void
}

const SharedFormSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Please provide an identifier')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Identifier can only contain letters, numbers, hyphens, and underscores'
    ),
  name: z
    .string()
    .min(1, 'Please provide a name for your custom provider')
    .max(100, 'Name must be less than 100 characters'),
  provider_type: z.enum(['oidc', 'oauth2']).default('oidc'),
  client_id: z.string().min(1, 'Please provide a client ID').trim(),
  client_secret: z.string().min(1, 'Please provide a client secret').trim(),
  email_optional: z.boolean().default(false),
  issuer: z.string().url('Please provide a valid URL').trim(),
  // comma-separated scopes in the form, will be transformed to array when sending
  scopes: z.string().default(''),
})

const OidcSchema = SharedFormSchema.extend({
  provider_type: z.literal('oidc'),
  discovery_url: z.union([z.string().url('Please provide a valid URL'), z.literal('')]).default(''),
})

const OAuth2Schema = SharedFormSchema.extend({
  provider_type: z.literal('oauth2'),
  authorization_url: z
    .union([z.string().url('Please provide a valid URL'), z.literal('')])
    .default(''),
  token_url: z.union([z.string().url('Please provide a valid URL'), z.literal('')]).default(''),
  userinfo_url: z.union([z.string().url('Please provide a valid URL'), z.literal('')]).default(''),
  jwks_uri: z.union([z.string().url('Please provide a valid URL'), z.literal('')]).default(''),
})

const FormSchema = z.discriminatedUnion('provider_type', [OidcSchema, OAuth2Schema])

const FORM_ID = 'create-or-update-custom-provider-form'

const initialValues = {
  name: '',
  identifier: '',
  provider_type: 'oidc' as const,
  issuer: '',
  authorization_url: '',
  token_url: '',
  userinfo_url: '',
  jwks_uri: '',
  discovery_url: '',
  scopes: '',
  client_id: '',
  client_secret: '',
  email_optional: false,
}

/** Mock autodiscovery endpoint: simulates success or error (random for demo) */

export const CreateOrUpdateCustomProviderSheet = ({
  visible,
  providerToEdit,
  onClose,
}: CreateOrUpdateCustomProviderSheetProps) => {
  const isEditMode = !!providerToEdit
  const { ref: projectRef } = useParams()
  const { hostEndpoint: endpointData } = useProjectApiUrl({ projectRef })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (visible) {
      if (providerToEdit) {
        if (providerToEdit.provider_type === 'oidc') {
          form.reset({
            name: providerToEdit.name,
            identifier: providerToEdit.identifier.replace('custom:', ''),
            provider_type: providerToEdit.provider_type,
            client_id: providerToEdit.client_id,
            client_secret: 'placeholder',
            email_optional: providerToEdit.email_optional,
            issuer: providerToEdit.issuer,
            discovery_url: providerToEdit.discovery_url,
            scopes: (providerToEdit.scopes || []).join(', '),
          })
        } else {
          form.reset({
            name: providerToEdit.name,
            identifier: providerToEdit.identifier.replace('custom:', ''),
            provider_type: providerToEdit.provider_type,
            client_id: providerToEdit.client_id,
            client_secret: 'placeholder',
            email_optional: providerToEdit.email_optional,
            issuer: providerToEdit.issuer,
            authorization_url: providerToEdit.authorization_url,
            token_url: providerToEdit.token_url,
            userinfo_url: providerToEdit.userinfo_url,
            jwks_uri: providerToEdit.jwks_uri,
            scopes: (providerToEdit.scopes || []).join(', '),
          })
        }
      } else {
        form.reset(initialValues)
      }
    }
  }, [visible, providerToEdit, form])

  const { mutate: createCustomProvider, isPending: isCreating } =
    useOAuthCustomProviderCreateMutation({
      onSuccess: () => {
        toast.success('Custom provider created successfully')
        onClose()
      },
    })
  const { mutate: updateCustomProvider, isPending: isUpdating } =
    useOAuthCustomProviderUpdateMutation({
      onSuccess: () => {
        toast.success('Custom provider updated successfully')
        onClose()
      },
    })

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    const identifierValue = (values.identifier || '').replace(/^custom:/i, '').trim()
    const identifier = identifierValue ? `custom:${identifierValue}` : ''

    let payload: Partial<OAuthCustomProviderUpdateVariables> = {}
    if (values.provider_type === 'oidc') {
      payload = {
        skip_nonce_check: false,
        discovery_url:
          values.discovery_url ||
          `${values.issuer.replace(/\/$/, '')}/.well-known/openid-configuration`,
      }
    } else {
      const issuer = values.issuer
      payload = {
        authorization_url:
          values.authorization_url || `${issuer.replace(/\/$/, '')}/oauth/authorize`,
        token_url: values.token_url || `${issuer.replace(/\/$/, '')}/oauth/token`,
        userinfo_url: values.userinfo_url || `${issuer.replace(/\/$/, '')}/oauth/userinfo`,
        jwks_uri: values.jwks_uri || `${issuer.replace(/\/$/, '')}/.well-known/jwks.json`,
      }
    }

    if (isEditMode) {
      // only include the client secret if it was changed, otherwise keep existing secret
      if (values.client_secret !== 'placeholder') {
        payload.client_secret = values.client_secret
      }
      updateCustomProvider({
        identifier,
        projectRef,
        clientEndpoint: endpointData,
        name: values.name,
        client_id: values.client_id,
        scopes: values.scopes.split(',').map((s) => s.trim()),
        issuer: values.issuer,
        pkce_enabled: true,
        enabled: true,
        email_optional: values.email_optional,
        ...payload,
      })
    } else {
      createCustomProvider({
        identifier,
        projectRef,
        clientEndpoint: endpointData,
        provider_type: values.provider_type,
        name: values.name,
        client_id: values.client_id,
        client_secret: values.client_secret,
        scopes: values.scopes.split(',').map((s) => s.trim()),
        issuer: values.issuer,
        pkce_enabled: true,
        enabled: true,
        email_optional: values.email_optional,
        ...payload,
      })
    }
  }

  const isManualConfiguration =
    useWatch_Shadcn_({ control: form.control, name: 'provider_type' }) === 'oauth2'

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: closeConfirmationModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose: () => {
      form.reset(initialValues)
      onClose()
    },
  })

  const issuerUrlValue = useWatch_Shadcn_({ control: form.control, name: 'issuer' })

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent
        size="lg"
        showClose={false}
        className="flex flex-col gap-0"
        tabIndex={undefined}
      >
        <SheetHeader>
          <div className="flex flex-row gap-3 items-center">
            <SheetClose
              className={cn(
                'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none data-[state=open]:bg-secondary',
                'transition'
              )}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="truncate">
              {isEditMode ? 'Update Custom Auth Provider' : 'Create Custom Auth Provider'}
            </SheetTitle>
          </div>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form
            className="flex-grow overflow-auto"
            onSubmit={form.handleSubmit(onSubmit)}
            id={FORM_ID}
          >
            <SheetSection className="flex-grow px-5 space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Provider Identifier"
                    description="Lowercase letters, numbers, and hyphens only. Used in SDK: signInWithOAuth({ provider: 'custom:my-company' })"
                  >
                    <FormControl_Shadcn_>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <InputGroupText>custom:</InputGroupText>
                        </InputGroupAddon>
                        <FormInputGroupInput
                          {...field}
                          placeholder="my-company"
                          disabled={isEditMode}
                          onChange={(e) => {
                            const raw = e.target.value
                            const userValue = raw.replace(/^custom:/i, '').trimStart()
                            field.onChange(userValue)
                          }}
                        />
                      </InputGroup>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Display Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Provider name" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="provider_type"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Configuration Method">
                    <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                      <RadioGroupStackedItem
                        className="[&>div]:px-3"
                        value="oidc"
                        label="Auto-discovery (Recommended)"
                        description="Automatically fetch OAuth endpoints"
                      />
                      <RadioGroupStackedItem
                        className="[&>div]:px-3"
                        value="oauth2"
                        label="Manual configuration"
                        description="Enter endpoints myself"
                      />
                    </RadioGroupStacked>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="flex-grow px-5 space-y-4">
              <FormSectionLabel>OAuth Endpoints</FormSectionLabel>
              <FormField_Shadcn_
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Issuer URL"
                    description="Base URL of your OAuth provider. Discovery runs when you save."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="https://auth.company.com" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            {isManualConfiguration ? (
              <SheetSection className="flex-grow px-5 pt-0 space-y-4" key="manual-config">
                <FormField_Shadcn_
                  control={form.control}
                  name="authorization_url"
                  render={({ field }) => (
                    <FormItemLayout layout="horizontal" label="Authorization URL">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder="https://auth.company.com/oauth/authorize"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="token_url"
                  render={({ field }) => (
                    <FormItemLayout layout="horizontal" label="Token URL">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder="https://auth.company.com/oauth/token"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="userinfo_url"
                  render={({ field }) => (
                    <FormItemLayout layout="horizontal" label="Userinfo URL">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder="https://auth.company.com/oauth/userinfo"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="jwks_uri"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="JWKS URI"
                      description="Required for ID token verification"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder="https://auth.company.com/.well-known/jwks.json"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
            ) : (
              <SheetSection className="flex-grow px-5 pt-0 space-y-4" key="discovery-config">
                <FormField_Shadcn_
                  control={form.control}
                  name="discovery_url"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Discovery URL"
                      description="Leave empty to use standard path: {issuer}/.well-known/openid-configuration. Only needed if your provider uses a non-standard discovery path. Discovery runs when you save."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          placeholder={
                            issuerUrlValue
                              ? `${issuerUrlValue}/.well-known/openid-configuration`
                              : 'https://github.company.com/.well-known/openid-configuration'
                          }
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
            )}
            <Separator />
            <SheetSection className="flex-grow px-5 space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Client ID">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Client ID" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="client_secret"
                render={({ field }) => (
                  <FormItemLayout layout="horizontal" label="Client Secret">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} type="password" placeholder="Client secret" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="flex-grow px-5 space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="scopes"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Scopes"
                    description="Comma-separated list. Common: openid, email, profile"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="openid, email, profile" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name="email_optional"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Allow users without email"
                    description="Allows the user to successfully authenticate when the provider does not return an email address."
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="flex-grow px-5 space-y-4">
              <FormItemLayout
                layout="horizontal"
                label="Callback URL"
                description="Configure this in your OAuth provider's settings."
              >
                <Input
                  copy
                  readOnly
                  disabled
                  value={`${endpointData}/auth/v1/callback`}
                  placeholder={`${endpointData}/auth/v1/callback`}
                />
              </FormItemLayout>
            </SheetSection>
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          <Button type="default" onClick={confirmOnClose}>
            Cancel
          </Button>
          <Button htmlType="submit" form={FORM_ID} loading={isCreating || isUpdating}>
            {isEditMode ? 'Update provider' : 'Create and enable provider'}
          </Button>
        </SheetFooter>
      </SheetContent>
      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </Sheet>
  )
}
