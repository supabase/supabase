import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSSOConfigCreateMutation } from 'data/sso/sso-config-create-mutation'
import { useSSOConfigUpdateMutation } from 'data/sso/sso-config-update-mutation'
import { useOrgSSOConfigQuery } from 'data/sso/sso-config-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
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

const FORM_ID = 'sso-config-form'

export const SSOConfig = () => {
  const { data: organization } = useSelectedOrganizationQuery()

  const {
    data: ssoConfig,
    isLoading,
    isSuccess,
    isError,
    error: configError,
  } = useOrgSSOConfigQuery({ orgSlug: organization?.slug }, { enabled: !!organization })

  const isSSOProviderNotFound = configError?.code === 404

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

  useEffect(() => {
    if (ssoConfig) {
      form.reset({
        enabled: ssoConfig.enabled,
        domains: ssoConfig.domains.map((domain) => ({ value: domain })),
        metadataXmlUrl: ssoConfig.metadata_xml_url,
        metadataXmlFile: ssoConfig.metadata_xml_file,
        emailMapping: ssoConfig.email_mapping.map((email) => ({ value: email })),
        userNameMapping: ssoConfig.user_name_mapping.map((userName) => ({ value: userName })),
        firstNameMapping: ssoConfig.first_name_mapping.map((firstName) => ({ value: firstName })),
        lastNameMapping: ssoConfig.last_name_mapping.map((lastName) => ({ value: lastName })),
        joinOrgOnSignup: ssoConfig.join_org_on_signup_enabled,
        roleOnJoin: ssoConfig.join_org_on_signup_role,
      })
    }
  }, [ssoConfig, form])

  const { mutate: createSSOConfig } = useSSOConfigCreateMutation({
    onError: (error) => {
      form.setError('root', { type: 'manual', message: error.message })
    },
    onSuccess: () => {
      form.reset()
    },
  })

  const { mutate: updateSSOConfig } = useSSOConfigUpdateMutation({
    onError: (error) => {
      form.setError('root', { type: 'manual', message: error.message })
    },
    onSuccess: () => {
      form.reset()
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
    if (ssoConfig) {
      updateSSOConfig(payload)
    } else {
      createSSOConfig(payload)
    }
  }

  const isSSOEnabled = form.watch('enabled')

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="!pt-8">
        {isLoading && (
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        )}
        {isError && !isSSOProviderNotFound && (
          <AlertError error={configError} subject="Failed to retrieve SSO configuration" />
        )}
        {(isSuccess || isSSOProviderNotFound) && (
          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent className="py-8">
                  <FormField_Shadcn_
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Enable Single Sign-On"
                        description="Enable and configure SSO for your application."
                        layout="flex"
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
                    <Button type="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!form.formState.isDirty || form.formState.isSubmitting}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
