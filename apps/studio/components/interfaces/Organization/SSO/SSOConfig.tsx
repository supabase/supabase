import { zodResolver } from '@hookform/resolvers/zod'
import { Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import z from 'zod'

import { AttributeMapping } from './AttributeMapping'
import { JoinOrganizationOnSignup } from './JoinOrganizationOnSignup'
import { SSODomains } from './SSODomains'
import { SSOMetadata } from './SSOMetadata'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useSSOConfigCreateMutation } from '@/data/sso/sso-config-create-mutation'
import { useSSOConfigDeleteMutation } from '@/data/sso/sso-config-delete-mutation'
import { useOrgSSOConfigQuery } from '@/data/sso/sso-config-query'
import { useSSOConfigUpdateMutation } from '@/data/sso/sso-config-update-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { DOCS_URL } from '@/lib/constants'

const FormSchema = z
  .object({
    enabled: z.boolean(),
    enableSpInitiated: z.boolean(),
    domains: z.array(
      z.object({
        value: z.string().trim(),
      })
    ),
    metadataXmlUrl: z.string().trim().optional(),
    metadataXmlFile: z.string().trim().optional(),
    emailMapping: z.array(z.object({ value: z.string().trim().min(1, 'This field is required') })),
    userNameMapping: z.array(z.object({ value: z.string().trim() })),
    firstNameMapping: z.array(z.object({ value: z.string().trim() })),
    lastNameMapping: z.array(z.object({ value: z.string().trim() })),
    joinOrgOnSignup: z.boolean(),
    roleOnJoin: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.enableSpInitiated) return

    const hasValidDomain = data.domains?.some((d) => d.value && d.value.trim().length > 0)
    if (!hasValidDomain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one domain is required when SP-initiated login is enabled',
        path: ['domains'],
      })
    }

    data.domains?.forEach((d, idx) => {
      if (!d.value || d.value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please provide a domain',
          path: ['domains', idx, 'value'],
        })
      }
    })
  })
  // set the error on both fields
  .refine((data) => data.metadataXmlUrl || data.metadataXmlFile, {
    message: 'Please provide either a metadata XML URL or upload a metadata XML file',
    path: ['metadataXmlUrl'],
  })
  .refine((data) => data.metadataXmlUrl || data.metadataXmlFile, {
    message: 'Please provide either a metadata XML URL or upload a metadata XML file',
    path: ['metadataXmlFile'],
  })

export type SSOConfigFormSchema = z.infer<typeof FormSchema>

const defaultValues = {
  enabled: false,
  enableSpInitiated: false,
  domains: [{ value: '' }],
  metadataXmlUrl: '',
  metadataXmlFile: '',
  emailMapping: [{ value: '' }],
  userNameMapping: [{ value: '' }],
  firstNameMapping: [{ value: '' }],
  lastNameMapping: [{ value: '' }],
  joinOrgOnSignup: false,
  roleOnJoin: 'Developer',
}

export const SSOConfig = () => {
  const FORM_ID = 'sso-config-form'

  const { data: organization } = useSelectedOrganizationQuery()
  const { hasAccess: hasAccessToSso, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('auth.platform.sso')

  const {
    data: ssoConfig,
    isPending: isLoadingSSOConfig,
    isSuccess,
    isError,
    error: configError,
  } = useOrgSSOConfigQuery({ orgSlug: organization?.slug }, { enabled: !!organization })

  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })

  const ssoMemberCount = members.filter((m) => m.is_sso_user === true).length
  const isSSOProviderNotFound = ssoConfig === null

  const form = useForm<SSOConfigFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const isSSOEnabled = form.watch('enabled')
  const enableSpInitiated = form.watch('enableSpInitiated')

  const { mutate: createSSOConfig, isPending: isCreating } = useSSOConfigCreateMutation({
    onSuccess: () => {
      toast.success('Successfully created SSO configuration')
      // Reset form to current values to mark as clean
      // This allows useEffect to reset with fresh data when query refetches
      form.reset(form.getValues())
    },
  })

  const { mutate: updateSSOConfig, isPending: isUpdating } = useSSOConfigUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated SSO configuration')
      // Reset form to current values to mark as clean
      // This allows useEffect to reset with fresh data when query refetches
      form.reset(form.getValues())
    },
  })

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)

  const { mutate: deleteSSOConfig, isPending: isDeleting } = useSSOConfigDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted SSO configuration')
      setIsDeleteModalVisible(false)
      form.reset(defaultValues)
    },
  })

  const onSubmit: SubmitHandler<SSOConfigFormSchema> = (values) => {
    const roleOnJoin = (values.roleOnJoin || 'Developer') as
      | 'Administrator'
      | 'Developer'
      | 'Owner'
      | 'Read-only'
      | undefined

    const payload = {
      slug: organization!.slug,
      config: {
        enabled: values.enabled,
        // Send empty array if SP-initiated is disabled
        domains: values.enableSpInitiated ? values.domains.map((d) => d.value).filter(Boolean) : [],
        metadata_xml_file: values.metadataXmlFile!,
        metadata_xml_url: values.metadataXmlUrl!,
        email_mapping: values.emailMapping.map((item) => item.value).filter(Boolean),
        first_name_mapping: values.firstNameMapping.map((item) => item.value).filter(Boolean),
        last_name_mapping: values.lastNameMapping.map((item) => item.value).filter(Boolean),
        user_name_mapping: values.userNameMapping.map((item) => item.value).filter(Boolean),
        join_org_on_signup_enabled: values.joinOrgOnSignup,
        join_org_on_signup_role: roleOnJoin,
      },
    }

    if (!!ssoConfig) {
      updateSSOConfig(payload)
    } else {
      createSSOConfig(payload)
    }
  }

  const onDeleteSSOConfig = () => {
    if (!organization?.slug) return
    deleteSSOConfig({ slug: organization.slug })
  }

  const syncFormFromConfig = useStaticEffectEvent(() => {
    if (!organization?.slug) return

    // Only reset form if it's not dirty (user hasn't made changes)
    if (ssoConfig && !form.formState.isDirty) {
      form.reset({
        enabled: ssoConfig.enabled,
        // Infer SP-initiated from domains presence
        enableSpInitiated: ssoConfig.domains && ssoConfig.domains.length > 0,
        domains: ssoConfig.domains?.map((domain) => ({ value: domain })) || [],
        metadataXmlUrl: ssoConfig.metadata_xml_url,
        metadataXmlFile: ssoConfig.metadata_xml_file,
        emailMapping: ssoConfig.email_mapping.map((email) => ({ value: email })),
        userNameMapping:
          ssoConfig.user_name_mapping?.map((userName) => ({ value: userName })) || [],
        firstNameMapping:
          ssoConfig.first_name_mapping?.map((firstName) => ({ value: firstName })) || [],
        lastNameMapping:
          ssoConfig.last_name_mapping?.map((lastName) => ({ value: lastName })) || [],
        joinOrgOnSignup: ssoConfig.join_org_on_signup_enabled,
        roleOnJoin: ssoConfig.join_org_on_signup_role,
      })
    }
  })

  useEffect(() => {
    syncFormFromConfig()
  }, [ssoConfig, organization?.slug, syncFormFromConfig])

  // Automatically add an empty domain field when SP-initiated is enabled
  const ensureDomainField = useStaticEffectEvent(() => {
    const currentDomains = form.getValues('domains')
    if (enableSpInitiated && (!currentDomains || currentDomains.length === 0)) {
      form.setValue('domains', [{ value: '' }], { shouldValidate: false })
    }
  })

  useEffect(() => {
    ensureDomainField()
  }, [enableSpInitiated, ensureDomainField])

  return (
    <ScaffoldContainer size="small" className="px-6 xl:px-10">
      <ScaffoldSection isFullWidth>
        {isLoadingEntitlement || (hasAccessToSso && isLoadingSSOConfig) ? (
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        ) : isError && !isSSOProviderNotFound ? (
          <AlertError error={configError} subject="Failed to retrieve SSO configuration" />
        ) : !hasAccessToSso ? (
          <UpgradeToPro
            plan="Team"
            source="organizationSso"
            primaryText="Organization Single Sign-on (SSO) is available from Team plan and above"
            secondaryText="SSO as a login option provides additional account security for your team by enforcing the use of an identity provider when logging into Supabase. Upgrade to Team or above to set up SSO for your organization."
            featureProposition="enable Single Sign-on (SSO)"
          />
        ) : isSuccess || isSSOProviderNotFound ? (
          <>
            <Form_Shadcn_ {...form}>
              <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex"
                          label="Enable Single Sign-On"
                          description={
                            <>
                              Enable and configure SSO for your organization. Learn more about SSO{' '}
                              <InlineLink
                                className="text-foreground-lighter hover:text-foreground"
                                href={`${DOCS_URL}/guides/platform/sso`}
                              >
                                here
                              </InlineLink>
                              .
                            </>
                          }
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              size="large"
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>

                  {isSSOEnabled && (
                    <>
                      <CardContent>
                        <FormField_Shadcn_
                          control={form.control}
                          name="enableSpInitiated"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Enable SP-initiated login"
                              description="Allow users to start the login flow from the Supabase dashboard by entering their email address. Requires configuring email domains below."
                            >
                              <FormControl_Shadcn_>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        {form.watch('enableSpInitiated') && (
                          <Admonition
                            type="note"
                            title="Understanding SSO login flows"
                            className="mt-4"
                          >
                            <div className="space-y-3 text-sm">
                              <div>
                                <strong>SP-initiated (Service Provider):</strong> Users start at
                                supabase.com, enter their email address, and are redirected to your
                                identity provider (Okta, Azure AD, etc.) for authentication.
                                Requires configuring email domains.
                              </div>
                              <div>
                                <strong>IdP-initiated (Identity Provider):</strong> Users click an
                                app tile or bookmark in your identity provider dashboard and are
                                directly authenticated into Supabase. Works automatically without
                                domain configuration.
                              </div>
                              <p className="text-foreground-lighter">
                                Most enterprises use IdP-initiated flow for its simplicity. Enable
                                SP-initiated only if you need users to start at supabase.com.{' '}
                                <InlineLink href={`${DOCS_URL}/guides/platform/sso#login-flows`}>
                                  Learn more about SSO flows
                                </InlineLink>
                                .
                              </p>
                            </div>
                          </Admonition>
                        )}
                      </CardContent>

                      {form.watch('enableSpInitiated') && (
                        <CardContent>
                          <SSODomains form={form} />
                        </CardContent>
                      )}

                      <CardContent>
                        <SSOMetadata form={form} />
                      </CardContent>

                      <CardContent>
                        <AttributeMapping
                          form={form}
                          emailField="emailMapping"
                          userNameField="userNameMapping"
                          firstNameField="firstNameMapping"
                          lastNameField="lastNameMapping"
                        />
                      </CardContent>

                      <CardContent>
                        <JoinOrganizationOnSignup form={form} />
                      </CardContent>
                    </>
                  )}

                  <CardFooter className="justify-between space-x-2">
                    <div>
                      {!!ssoConfig && (
                        <Button
                          type="danger"
                          icon={<Trash />}
                          onClick={() => setIsDeleteModalVisible(true)}
                          disabled={isCreating || isUpdating || isDeleting}
                        >
                          Delete SSO Provider
                        </Button>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {form.formState.isDirty && (
                        <Button
                          type="default"
                          disabled={isCreating || isUpdating}
                          onClick={() => form.reset()}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isCreating || isUpdating}
                        disabled={!form.formState.isDirty || isCreating || isUpdating}
                      >
                        Save changes
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>

            <TextConfirmModal
              visible={isDeleteModalVisible}
              size="small"
              variant="destructive"
              title="Delete SSO Provider"
              loading={isDeleting}
              confirmString={ssoConfig?.domains?.[0] || organization?.slug || ''}
              confirmPlaceholder={`Type ${ssoConfig?.domains?.[0] ? 'the first domain' : 'the organization slug'} to confirm`}
              confirmLabel="I understand, delete SSO provider and members"
              onConfirm={onDeleteSSOConfig}
              onCancel={() => setIsDeleteModalVisible(false)}
            >
              <div className="space-y-3">
                <p className="text-sm text-foreground-lighter">
                  You are about to delete the SSO provider
                  {ssoConfig?.domains?.[0] && (
                    <>
                      {' '}
                      for{' '}
                      <span className="text-foreground font-semibold">{ssoConfig.domains[0]}</span>
                    </>
                  )}
                  .
                </p>

                {ssoMemberCount > 0 && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {ssoMemberCount} organization member{ssoMemberCount !== 1 ? 's' : ''}
                      </span>{' '}
                      who authenticate via SSO will be{' '}
                      <span className="font-semibold">permanently removed</span> from this
                      organization.
                    </p>
                  </div>
                )}

                <p className="text-sm text-foreground-lighter">This action will:</p>
                <ul className="text-sm text-foreground-lighter list-disc list-inside space-y-1 ml-2">
                  <li>Disable SSO authentication for this organization</li>
                  <li>Remove all members who signed up using SSO</li>
                  <li>Prevent future SSO-based sign-ins</li>
                </ul>

                <p className="text-sm text-foreground-lighter">
                  <span className="text-foreground font-semibold">
                    This action cannot be undone.
                  </span>{' '}
                  Members will need to be re-invited if you wish to restore their access.
                </p>
              </div>
            </TextConfirmModal>
          </>
        ) : null}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
