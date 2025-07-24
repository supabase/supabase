import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
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
          value: z
            .string()
            .trim()
            .min(1, 'Please provide a domain')
            .url('Please provide a valid URL'),
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
      roleOnJoin: 'developer',
    },
  })

  const onSubmit: SubmitHandler<SSOConfigFormSchema> = ({
    enabled,
    domains,
    metadataXmlUrl,
    metadataXmlFile,
    emailMapping,
    userNameMapping,
    firstNameMapping,
    lastNameMapping,
    joinOrgOnSignup,
    roleOnJoin,
  }) => {
    const attributeMapping = {
      keys: {
        email: emailMapping,
        user_name: userNameMapping.filter(Boolean),
        first_name: firstNameMapping.filter(Boolean),
        last_name: lastNameMapping.filter(Boolean),
      },
    }
    console.log(
      enabled,
      domains,
      metadataXmlUrl,
      metadataXmlFile,
      attributeMapping,
      joinOrgOnSignup,
      roleOnJoin
    )
  }

  const isSSOEnabled = form.watch('enabled')

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="!pt-8">
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

              {isSSOEnabled && (
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
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
