import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import InformationBox from 'components/ui/InformationBox'
import { ProjectSettingsResponse } from 'data/config/project-settings-query'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { ReactNode } from 'react'
import { Form, IconAlertCircle, Input } from 'ui'
import * as yup from 'yup'

const FORM_ID = 'custom-domains-form'

const schema = yup.object({
  domain: yup.string().required('A value for your custom domain is required'),
})

export type CustomDomainsConfigureHostnameProps = {
  projectRef?: string
  title: ReactNode
  settings?: ProjectSettingsResponse
}

const CustomDomainsConfigureHostname = ({
  projectRef,
  title,
  settings,
}: CustomDomainsConfigureHostnameProps) => {
  const { ui } = useStore()

  const { mutateAsync: createCustomDomain } = useCustomDomainCreateMutation()

  const onCreateCustomDomain = async (values: yup.InferType<typeof schema>) => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }

    try {
      await createCustomDomain({
        projectRef,
        customDomain: values.domain,
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <Form
      id={FORM_ID}
      initialValues={{ domain: '' }}
      validationSchema={schema}
      onSubmit={onCreateCustomDomain}
    >
      {({ isSubmitting, handleReset, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        return (
          <>
            <FormPanel
              disabled={true}
              header={title}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={FORM_ID}
                    isSubmitting={isSubmitting}
                    submitText="Add"
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!true}
                    helper={
                      !true
                        ? "You need additional permissions to update your project's custom domain settings"
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>Add a Custom Domain</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input
                    id="domain"
                    className="w-full"
                    type="text"
                    name="domain"
                    placeholder="subdomain.example.com"
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default observer(CustomDomainsConfigureHostname)
