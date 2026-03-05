import { zodResolver } from '@hookform/resolvers/zod'
import type { CustomOAuthProvider } from '@supabase/auth-js'
import { useParams } from 'common'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Input_Shadcn_,
  PrePostTab,
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
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { FormSectionLabel } from '@/components/ui/Forms/FormSection'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useOAuthCustomProviderCreateMutation } from '@/data/oauth-custom-providers/oauth-custom-provider-create-mutation'
import { useOAuthCustomProviderUpdateMutation } from '@/data/oauth-custom-providers/oauth-custom-provider-update-mutation'

interface CreateOrUpdateCustomProviderSheetProps {
  visible: boolean
  providerToEdit?: CustomOAuthProvider
  onSuccess: (provider: CustomOAuthProvider) => void
  onCancel: () => void
}

const FormSchema = z
  .object({
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
    client_id: z.string().optional(), // Only in edit mode; provided after entity is created
    client_secret: z.string().optional(),
    email_optional: z.boolean().default(false),
    issuer: z.string().url('Please provide a valid URL'),
    authorization_url: z.union([z.string().url(), z.literal('')]).default(''),
    token_url: z.union([z.string().url(), z.literal('')]).default(''),
    userinfo_url: z.union([z.string().url(), z.literal('')]).default(''),
    jwks_uri: z.union([z.string().url(), z.literal('')]).default(''),
    discovery_url: z.union([z.string().url(), z.literal('')]).default(''),
    scopes: z.array(z.string()).default([]),
    callback_url: z.string().optional(), // Readonly display from project endpoint, not part of payload
  })
  .superRefine((data, ctx) => {
    if (data.provider_type === 'oauth2') {
      if (!data.authorization_url?.trim())
        ctx.addIssue({ code: 'custom', path: ['authorization_url'], message: 'Required' })
      if (!data.token_url?.trim())
        ctx.addIssue({ code: 'custom', path: ['token_url'], message: 'Required' })
      if (!data.userinfo_url?.trim())
        ctx.addIssue({ code: 'custom', path: ['userinfo_url'], message: 'Required' })
      if (!data.jwks_uri?.trim())
        ctx.addIssue({ code: 'custom', path: ['jwks_uri'], message: 'Required' })
    }
  })

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
  scopes: [],
  client_id: '',
  client_secret: '',
  email_optional: false,
}

/** Mock autodiscovery endpoint: simulates success or error (random for demo) */

export const CreateOrUpdateCustomProviderSheet = ({
  visible,
  providerToEdit,
  onSuccess,
  onCancel,
}: CreateOrUpdateCustomProviderSheetProps) => {
  const isEditMode = !!providerToEdit
  const { ref: projectRef } = useParams()
  const { data: endpointData } = useProjectApiUrl({ projectRef })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (visible) {
      if (providerToEdit) {
        form.reset({
          name: providerToEdit.name,
          identifier: providerToEdit.identifier.replace('custom:', ''),
          provider_type: providerToEdit.provider_type,
          client_id: providerToEdit.client_id,
          client_secret: '********',
          email_optional: providerToEdit.email_optional,
          issuer: providerToEdit.issuer,
          authorization_url: providerToEdit.authorization_url,
          token_url: providerToEdit.token_url,
          userinfo_url: providerToEdit.userinfo_url,
          jwks_uri: providerToEdit.jwks_uri,
          discovery_url: providerToEdit.discovery_url,
          scopes: providerToEdit.scopes || [],
        })
      } else {
        form.reset(initialValues)
      }
    }
  }, [visible, providerToEdit, form])

  const { mutate: createCustomProvider } = useOAuthCustomProviderCreateMutation({
    onSuccess: (createdProvider) => {
      onSuccess(createdProvider)
    },
  })
  const { mutate: updateCustomProvider } = useOAuthCustomProviderUpdateMutation({
    onSuccess: (updatedProvider) => {
      onSuccess(updatedProvider)
    },
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const identifierValue = (data.identifier || '').replace(/^custom:/i, '').trim()
    const identifier = identifierValue ? `custom:${identifierValue}` : ''

    let discoveryData = {
      authorization_url: data.authorization_url,
      token_url: data.token_url,
      userinfo_url: data.userinfo_url,
      jwks_uri: data.jwks_uri,
    }

    const issuer = data.issuer?.trim()
    const discoveryUrl =
      data.discovery_url?.trim() ||
      (issuer ? `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration` : '')
    if (data.provider_type === 'oidc') {
      if (!discoveryUrl) {
        form.setError('issuer', { message: 'Please provide an Issuer URL or Discovery URL' })
        return
      }

      const baseUrl = discoveryUrl.replace(/\/\.well-known\/openid-configuration\/?$/i, '')

      discoveryData = {
        authorization_url: `${baseUrl.replace(/\/$/, '')}/oauth/authorize`,
        token_url: `${baseUrl.replace(/\/$/, '')}/oauth/token`,
        userinfo_url: `${baseUrl.replace(/\/$/, '')}/oauth/userinfo`,
        jwks_uri: `${baseUrl.replace(/\/$/, '')}/.well-known/jwks.json`,
      }
    }

    if (isEditMode) {
      if (!data.client_id?.trim()) {
        form.setError('client_id', { message: 'Client ID is required' })
        return
      }
      if (!data.client_secret?.trim()) {
        form.setError('client_secret', { message: 'Client secret is required' })
        return
      }

      updateCustomProvider({
        identifier,
        projectRef: undefined,
        clientEndpoint: undefined,
        name: data.name,
        client_id: data.client_id,
        scopes: data.scopes,
        issuer: data.issuer,
        pkce_enabled: true,
        enabled: true,
        email_optional: data.email_optional,
        ...(data.provider_type === 'oidc' &&
          discoveryData && {
            issuer: data.issuer,
            skip_nonce_check: false,
            discovery_url: discoveryUrl,
          }),
        authorization_url: data.authorization_url,
        token_url: data.token_url,
        userinfo_url: data.userinfo_url,
        jwks_uri: data.jwks_uri,
      })
    } else {
      createCustomProvider({
        identifier,
        projectRef: projectRef!,
        clientEndpoint: endpointData!,
        provider_type: data.provider_type,
        name: data.name,
        client_id: isEditMode ? (data.client_id ?? '').trim() : '',
        client_secret: isEditMode ? (data.client_secret ?? '').trim() : '',
        scopes: data.scopes || [],
        issuer: data.issuer,
        pkce_enabled: true,
        enabled: true,
        email_optional: data.email_optional,
        ...(data.provider_type === 'oidc' &&
          discoveryData && {
            issuer: data.issuer,
            skip_nonce_check: false,
            discovery_url: discoveryUrl,
          }),
        authorization_url: data.authorization_url,
        token_url: data.token_url,
        userinfo_url: data.userinfo_url,
        jwks_uri: data.jwks_uri,
      })
    }
  }

  const onClose = () => {
    form.reset(initialValues)
    onCancel()
  }

  const isManualConfiguration = form.watch('provider_type') === 'oauth2'

  return (
    <Sheet open={visible} onOpenChange={() => onCancel()}>
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
                      <PrePostTab preTab="custom:" className="w-full">
                        <Input_Shadcn_
                          {...field}
                          placeholder="my-company"
                          disabled={isEditMode}
                          onChange={(e) => {
                            const raw = e.target.value
                            const userValue = raw.replace(/^custom:/i, '').trimStart()
                            field.onChange(userValue)
                          }}
                        />
                      </PrePostTab>
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
              <SheetSection className="flex-grow px-5 pt-0 space-y-4">
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
              <>
                <Separator />
                <SheetSection className="flex-grow space-y-4 p-0">
                  <Accordion_Shadcn_ type="single" collapsible>
                    <AccordionItem_Shadcn_ value="advanced-configuration" className="border-none">
                      <AccordionTrigger_Shadcn_ className="py-3 px-5 font-normal text-sm text-foreground-light hover:no-underline hover:text-foreground">
                        <FormSectionLabel>Advanced: Custom discovery URL</FormSectionLabel>
                      </AccordionTrigger_Shadcn_>
                      <AccordionContent_Shadcn_ className="px-5 flex flex-col gap-y-4">
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
                                  placeholder="https://github.company.com/.well-known/openid-configuration"
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </AccordionContent_Shadcn_>
                    </AccordionItem_Shadcn_>
                  </Accordion_Shadcn_>
                </SheetSection>
              </>
            )}
            {isEditMode && (
              <>
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
              </>
            )}
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
              <FormField_Shadcn_
                control={form.control}
                name="callback_url"
                render={({ field }) => (
                  <FormItemLayout
                    layout="horizontal"
                    label="Callback URL"
                    description="Configure this in your OAuth provider's settings: (readonly field, existing)"
                  >
                    <FormControl_Shadcn_>
                      <Input
                        {...field}
                        copy
                        readOnly
                        disabled
                        value={`${endpointData}/auth/v1/callback`}
                        placeholder={`${endpointData}/auth/v1/callback`}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
          </form>
        </Form_Shadcn_>
        <SheetFooter>
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button htmlType="submit" form={FORM_ID}>
            {isEditMode ? 'Update provider' : 'Create and enable provider'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
