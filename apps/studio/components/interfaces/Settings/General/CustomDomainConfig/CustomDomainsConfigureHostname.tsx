import { PermissionAction } from '@supabase/shared-types/out/constants'
import * as yup from 'yup'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DocsButton } from 'components/ui/DocsButton'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Form, Input } from 'ui'

const schema = yup.object({
  domain: yup.string().required('A value for your custom domain is required'),
})

const CustomDomainsConfigureHostname = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const { mutate: checkCNAMERecord, isLoading: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: createCustomDomain, isLoading: isCreating } = useCustomDomainCreateMutation()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const FORM_ID = 'custom-domains-form'
  const endpoint = settings?.app_config?.endpoint
  const canConfigureCustomDomain = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const onCreateCustomDomain = async (values: yup.InferType<typeof schema>) => {
    if (!ref) return console.error('Project ref is required')

    checkCNAMERecord(
      { domain: values.domain },
      {
        onSuccess: () => {
          createCustomDomain({ projectRef: ref, customDomain: values.domain })
        },
      }
    )
  }

  return (
    <Form
      id={FORM_ID}
      initialValues={{ domain: '' }}
      validationSchema={schema}
      onSubmit={onCreateCustomDomain}
    >
      {({ handleReset, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        return (
          <>
            <FormPanel
              disabled={!canConfigureCustomDomain}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={FORM_ID}
                    isSubmitting={isCheckingRecord || isCreating}
                    submitText="Add"
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!true}
                    helper={
                      !canConfigureCustomDomain ? (
                        "You need additional permissions to update your project's custom domain settings"
                      ) : (
                        <DocsButton href="https://supabase.com/docs/guides/platform/custom-domains" />
                      )
                    }
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>Add a custom domain</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input
                    id="domain"
                    disabled={!canConfigureCustomDomain || isCheckingRecord || isCreating}
                    className="w-full"
                    type="text"
                    name="domain"
                    placeholder="subdomain.example.com"
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Configure a CNAME record</FormSectionLabel>}>
                <p className="col-span-12 text-sm lg:col-span-7 leading-6">
                  Set up a CNAME record for{' '}
                  {values.domain ? (
                    <code className="text-xs">{values.domain}</code>
                  ) : (
                    'your custom domain'
                  )}{' '}
                  resolving to{' '}
                  {endpoint ? (
                    <code className="text-xs">{endpoint}</code>
                  ) : (
                    "your project's API URL"
                  )}{' '}
                  with as low a TTL as possible. If you're using Cloudflare as your DNS provider,
                  disable the proxy option.
                </p>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default CustomDomainsConfigureHostname
