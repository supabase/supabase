import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainActivateMutation } from 'data/custom-domains/custom-domains-activate-mutation'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainReverifyMutation } from 'data/custom-domains/custom-domains-reverify-mutation'
import { useParams, useStore } from 'hooks'
import { Alert, Button, Form, IconAlertCircle, IconCloudLightning, IconRefreshCw, Input } from 'ui'
import * as yup from 'yup'

const FORM_ID = 'custom-domains-form'

const schema = yup.object({
  domain: yup.string().required('Custom domain is required'),
})

const CustomDomainConfig = () => {
  const { ui } = useStore()
  const { ref } = useParams()

  const { isLoading: isSettingsLoading, data: settings } = useProjectSettingsQuery({
    projectRef: ref,
  })

  const {
    isLoading: isCustomDomainsLoading,
    isError,
    error,
    isSuccess,
    data,
  } = useCustomDomainsQuery(
    { projectRef: ref },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  const isLoading = isSettingsLoading || isCustomDomainsLoading

  const isNoHostnameConfiguredError =
    isError &&
    (error as any)?.code === 400 &&
    (error as any)?.message?.includes('custom hostname configuration')

  const isUnknownError = isError && !isNoHostnameConfiguredError

  const { mutateAsync: createCustomDomain } = useCustomDomainCreateMutation()

  const onCreateCustomDomain = async (values: yup.InferType<typeof schema>) => {
    if (!ref) {
      throw new Error('Project ref is required')
    }

    try {
      const something = await createCustomDomain({
        projectRef: ref,
        customDomain: values.domain,
      })

      console.log('something:', something)
    } catch (error) {
      console.log('asf error:', error)
    }
  }

  const { mutate: reverifyCustomDomain, isLoading: isReverifyLoading } =
    useCustomDomainReverifyMutation()

  const onReverifyCustomDomain = () => {
    if (!ref) {
      throw new Error('Project ref is required')
    }

    reverifyCustomDomain({ projectRef: ref })
  }

  const { mutate: activateCustomDomain, isLoading: isActivateLoading } =
    useCustomDomainActivateMutation()

  const onActivateCustomDomain = () => {
    if (!ref) {
      throw new Error('Project ref is required')
    }

    activateCustomDomain({ projectRef: ref })
  }

  if (isNoHostnameConfiguredError) {
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
                header={<p>Custom Domains</p>}
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
                <FormSection header={<FormSectionLabel>Add Custom Domain</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
                    <Input
                      id="domain"
                      className="w-full"
                      type="text"
                      name="domain"
                      placeholder="subdomain.example.com"
                    />

                    <Alert
                      withIcon
                      variant="info"
                      title="Setup CNAME record before adding a custom domain"
                    >
                      Create a CNAME record in your DNS provider pointing to{' '}
                      <code>{settings?.autoApiService.app_config.endpoint ?? 'Loading...'}</code>,
                      then add your custom domain above.
                    </Alert>
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            </>
          )
        }}
      </Form>
    )
  }

  return (
    <>
      <Panel title={<h5 className="mb-0">Custom Domains</h5>}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
          {isLoading && <div>Loading...</div>}

          {isUnknownError && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Failed to retrieve custom domain configuration
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="flex flex-col">
              {data.customDomain.verification_errors?.includes(
                'custom hostname does not CNAME to this zone.'
              ) && (
                <div>
                  cname {data.customDomain.hostname}: {settings?.autoApiService.app_config.endpoint}
                </div>
              )}

              {data.customDomain.ownership_verification && (
                <div>
                  {data.customDomain.ownership_verification.type} -{' '}
                  {data.customDomain.ownership_verification.name}:{' '}
                  {data.customDomain.ownership_verification.value}
                </div>
              )}

              {data.customDomain.ssl.status === 'pending_validation' && (
                <div>
                  txt {data.customDomain.ssl.txt_name}: {data.customDomain.ssl.txt_value}
                </div>
              )}

              <Button
                icon={<IconRefreshCw />}
                onClick={onReverifyCustomDomain}
                loading={isReverifyLoading}
              >
                Verify
              </Button>

              {data.status === '4_origin_setup_completed' && (
                <Button
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                      />
                    </svg>
                  }
                  onClick={onActivateCustomDomain}
                  loading={isActivateLoading}
                >
                  Activate
                </Button>
              )}
            </div>
          )}
        </Panel.Content>
      </Panel>

      {/* Add modals here */}
    </>
  )
}

export default CustomDomainConfig
