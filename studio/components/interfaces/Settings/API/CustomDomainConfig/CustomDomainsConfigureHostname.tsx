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
  onSuccessfullyAdded: () => void
}

const CustomDomainsConfigureHostname = ({
  projectRef,
  title,
  settings,
  onSuccessfullyAdded,
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
      onSuccessfullyAdded()
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
                <div className="col-span-12">
                  <InformationBox
                    hideCollapse
                    defaultVisibility
                    icon={<IconAlertCircle strokeWidth={2} />}
                    title="Setup a CNAME record first before adding a custom domain"
                    description={
                      <p>
                        Create a CNAME record in your DNS provider pointing to{' '}
                        <code>{settings?.autoApiService.app_config.endpoint ?? 'Loading...'}</code>{' '}
                        with as low a TTL as possible before adding your custom domain above.
                      </p>
                    }
                  />
                </div>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default observer(CustomDomainsConfigureHostname)
