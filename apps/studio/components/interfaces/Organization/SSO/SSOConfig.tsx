import { zodResolver } from '@hookform/resolvers/zod'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
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

import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'
import Domains from './Domains'
import Metadata from './Metadata'
import AttributeMapping from './AttributeMapping'
import Join from './Join'

// attribute mapping has these fields:
// email: can be a single string or an array of strings
// user_name: can be a single string or an array of strings
// first_name: can be a single string or an array of strings
// last_name: can be a single string or an array of strings

const attrValueArraySchema = z.array(z.object({ value: z.string() }))

const FormSchema = z
  .object({
    enabled: z.boolean(),
    domains: z.array(z.object({ value: z.string().trim().min(1, 'Please provide a domain') })),
    metadataXmlUrl: z.string().trim().url('Please provide a valid URL').optional(),
    metadataXmlFile: z.string().trim().optional(),
    emailMapping: attrValueArraySchema,
    userNameMapping: attrValueArraySchema,
    firstNameMapping: attrValueArraySchema,
    lastNameMapping: attrValueArraySchema,
    joinOrgOnSignup: z.boolean(),
  })
  .refine((data) => data.metadataXmlUrl || data.metadataXmlFile, {
    message: 'Please provide either a metadata XML URL or upload a metadata XML file',
    path: ['metadataXmlUrl'],
  })
  .refine(
    (data) =>
      Array.isArray(data.emailMapping) &&
      data.emailMapping.length > 0 &&
      data.emailMapping[0].value.trim() !== '',
    {
      message: 'Email mapping is required',
      path: ['emailMapping'],
    }
  )

export type SSOConfigForm = z.infer<typeof FormSchema>

const FORM_ID = 'sso-config-form'

const SSOConfig = () => {
  const form = useForm<SSOConfigForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true, // TODO: set to false before merging
      domains: [],
      metadataXmlUrl: '',
      metadataXmlFile: '',
      emailMapping: [{ value: '' }],
      userNameMapping: [],
      firstNameMapping: [],
      lastNameMapping: [],
      joinOrgOnSignup: false,
    },
  })

  const onSubmit: SubmitHandler<SSOConfigForm> = async ({
    enabled,
    domains,
    metadataXmlUrl,
    metadataXmlFile,
    emailMapping,
    userNameMapping,
    firstNameMapping,
    lastNameMapping,
    joinOrgOnSignup,
  }) => {
    const attributeMapping = {
      keys: {
        email: emailMapping,
        user_name: userNameMapping,
        first_name: firstNameMapping,
        last_name: lastNameMapping,
      },
    }
    console.log(
      enabled,
      domains,
      metadataXmlUrl,
      metadataXmlFile,
      attributeMapping,
      joinOrgOnSignup
    )
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        {/* maybe don't need these at all*/}
        {/* <ScaffoldSectionTitle className="mb-2">Configure Single Sign-On</ScaffoldSectionTitle>
        <ScaffoldDescription className="mb-4">
          Configure Single Sign-On (SSO) for your organization.
        </ScaffoldDescription> */}

        <Form_Shadcn_ {...form}>
          <Card>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Enable Single Sign-On"
                      description="Enable and configure SSO for your application."
                      layout="flex-row-reverse"
                      className="gap-1 relative flex items-center justify-between pb-4"
                    >
                      <FormControl_Shadcn_ className="flex items-center gap-2 zans">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardContent>{form.watch('enabled') && <Domains form={form} />}</CardContent>
              <CardContent>{form.watch('enabled') && <Metadata form={form} />}</CardContent>
              <CardContent>
                {form.watch('enabled') && (
                  <>
                    <AttributeMapping
                      form={form}
                      emailField="emailMapping"
                      userNameField="userNameMapping"
                      firstNameField="firstNameMapping"
                      lastNameField="lastNameMapping"
                    />
                  </>
                )}
              </CardContent>
              <CardContent>{form.watch('enabled') && <Join form={form} />}</CardContent>
            </form>

            <CardFooter className="justify-end space-x-2">
              {form.formState.isDirty && (
                <Button type="default" onClick={() => form.reset()}>
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                //disabled={}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </Form_Shadcn_>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default SSOConfig
