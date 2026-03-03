import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useSSOConfigCreateMutation } from 'data/sso/sso-config-create-mutation'
import { useOrgSSOConfigQuery } from 'data/sso/sso-config-query'
import { useSSOConfigUpdateMutation } from 'data/sso/sso-config-update-mutation'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { AttributeMapping } from './AttributeMapping'
import { JoinOrganizationOnSignup } from './JoinOrganizationOnSignup'
import { SSODomains } from './SSODomains'
import { SSOMetadata } from './SSOMetadata'

const FormSchema = z
  .object({
    enabled: z.boolean(),
    domains: z
      .array(
        z.object({
          value: z.string().trim().min(1, 'Please provide a domain'),
        })
      )
      .min(1, 'At least one domain is required'),
    metadataXmlUrl: z.string().trim().optional(),
    metadataXmlFile: z.string().trim().optional(),
    emailMapping: z.array(z.object({ value: z.string().trim().min(1, 'This field is required') })),
    userNameMapping: z.array(z.object({ value: z.string().trim() })),
    firstNameMapping: z.array(z.object({ value: z.string().trim() })),
    lastNameMapping: z.array(z.object({ value: z.string().trim() })),
    joinOrgOnSignup: z.boolean(),
    roleOnJoin: z.string().optional(),
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

  const isSSOProviderNotFound = ssoConfig === null

  const form = useForm<SSOConfigFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: false,
      domains: [{ value: '' }],
      metadataXmlUrl: '',
      metadataXmlFile: '',
      emailMapping: [{ value: '' }],
      userNameMapping: [{ value: '' }],
      firstNameMapping: [{ value: '' }],
      lastNameMapping: [{ value: '' }],
      joinOrgOnSignup: false,
      roleOnJoin: 'Developer',
    },
  })

  const isSSOEnabled = form.watch('enabled')

  const { mutate: createSSOConfig, isPending: isCreating } = useSSOConfigCreateMutation({
    onSuccess: () => form.reset(),
  })

  const { mutate: updateSSOConfig, isPending: isUpdating } = useSSOConfigUpdateMutation({
    onSuccess: () => form.reset(),
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
        domains: values.domains.map((d) => d.value),
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

  useEffect(() => {
    if (ssoConfig) {
      form.reset({
        enabled: ssoConfig.enabled,
        domains: ssoConfig.domains.map((domain) => ({ value: domain })),
        metadataXmlUrl: ssoConfig.metadata_xml_url,
        metadataXmlFile: ssoConfig.metadata_xml_file,
        emailMapping: ssoConfig.email_mapping.map((email) => ({ value: email })),
        userNameMapping: ssoConfig.user_name_mapping?.map((userName) => ({ value: userName })),
        firstNameMapping: ssoConfig.first_name_mapping?.map((firstName) => ({ value: firstName })),
        lastNameMapping: ssoConfig.last_name_mapping?.map((lastName) => ({ value: lastName })),
        joinOrgOnSignup: ssoConfig.join_org_on_signup_enabled,
        roleOnJoin: ssoConfig.join_org_on_signup_role,
      })
    }
  }, [ssoConfig, form])

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
            secondaryText="SSO as a login option provides additional acccount security for your team by enforcing the use of an identity provider when logging into Supabase. Upgrade to Team or above to set up SSO for your organization."
            featureProposition="enable Single Sign-on (SSO)"
          />
        ) : isSuccess || isSSOProviderNotFound ? (
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

                {(isSSOEnabled || ssoConfig) && (
                  <>
                    <CardContent>
                      <SSODomains form={form} />
                    </CardContent>

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

                <CardFooter className="justify-end space-x-2">
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
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        ) : null}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
