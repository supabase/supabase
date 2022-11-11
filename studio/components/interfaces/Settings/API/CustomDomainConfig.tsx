import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
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
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, Form, IconAlertCircle, IconRefreshCw, Input } from 'ui'
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

  console.log(data)

  const isLoading = isSettingsLoading || isCustomDomainsLoading

  const isNoHostnameConfiguredError =
    isError &&
    (error as any)?.code === 400 &&
    (error as any)?.message?.includes('custom hostname configuration')

  const isNotAllowedError =
    isError &&
    (error as any)?.code === 400 &&
    (error as any)?.message?.includes('not allowed to set up custom domain')

  const isUnknownError = isError && !isNoHostnameConfiguredError && !isNotAllowedError

  const { mutateAsync: createCustomDomain } = useCustomDomainCreateMutation()

  const onCreateCustomDomain = async (values: yup.InferType<typeof schema>) => {
    if (!ref) {
      throw new Error('Project ref is required')
    }

    try {
      await createCustomDomain({
        projectRef: ref,
        customDomain: values.domain,
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error.message,
      })
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

  const [isActivateConfirmModalVisible, setIsActivateConfirmModalVisible] = useState(false)

  const { mutateAsync: activateCustomDomain, isLoading: isActivateLoading } =
    useCustomDomainActivateMutation()

  const onActivateCustomDomain = async () => {
    if (!ref) {
      throw new Error('Project ref is required')
    }

    try {
      await activateCustomDomain({ projectRef: ref })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error.message,
      })
    }
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

          {isNotAllowedError && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Custom domains are not enabled for this project. Please{' '}
                <Link href={`/support/new?ref=${ref}&category=sales`}>
                  <a className="underline">contact support</a>
                </Link>{' '}
                if you would like to enable this feature.
              </p>
            </div>
          )}

          {isUnknownError && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Failed to retrieve custom domain configuration. Please try again later or{' '}
                <Link href={`/support/new?ref=${ref}&category=sales`}>
                  <a className="underline">contact support</a>
                </Link>
                .
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="flex flex-col gap-6">
              {data.status === '2_initiated' && (
                <div>
                  <h4 className="text-scale-1200">
                    Set the following record(s) to your DNS provider:
                  </h4>
                  <span className="text-sm text-scale-1100">
                    Please note that it may take up to 24 hours for the DNS records to propagate.
                  </span>
                </div>
              )}

              {(data.status === '2_initiated' || data.status === '3_challenge_verified') &&
                data.customDomain.verification_errors?.includes(
                  'custom hostname does not CNAME to this zone.'
                ) && (
                  <DNSRecord
                    type="CNAME"
                    name={data.customDomain.hostname}
                    value={settings?.autoApiService.app_config.endpoint ?? 'Loading...'}
                  />
                )}

              {(data.status === '2_initiated' || data.status === '3_challenge_verified') &&
                data.customDomain.ownership_verification && (
                  <DNSRecord
                    type={data.customDomain.ownership_verification.type}
                    name={data.customDomain.ownership_verification.name}
                    value={data.customDomain.ownership_verification.value}
                  />
                )}

              {(data.status === '2_initiated' || data.status === '3_challenge_verified') &&
                data.customDomain.ssl.status === 'pending_validation' && (
                  <DNSRecord
                    type="TXT"
                    name={data.customDomain.ssl.txt_name ?? 'Loading...'}
                    value={data.customDomain.ssl.txt_value ?? 'Loading...'}
                  />
                )}

              {(data.status === '2_initiated' || data.status === '3_challenge_verified') && (
                <Button
                  icon={<IconRefreshCw />}
                  onClick={onReverifyCustomDomain}
                  loading={isReverifyLoading}
                  className="self-end"
                >
                  Verify
                </Button>
              )}

              {data.status === '4_origin_setup_completed' && (
                <div className="flex flex-col items-start gap-6">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-scale-1200">
                      Setup complete! Press activate to enable {data.customDomain.hostname} for this
                      project.
                    </h4>

                    <span className="text-sm text-scale-1100">
                      Supabase recommends that your schedule a downtime window of 20-30 minutes for
                      your application, as you will need to update any client code (e.g., frontends,
                      mobile apps), and any OAuth providers (e.g., google, github) that use the
                      current supabase subdomain.
                    </span>
                  </div>

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
                    onClick={() => setIsActivateConfirmModalVisible(true)}
                    className="self-end"
                  >
                    Activate
                  </Button>
                </div>
              )}
            </div>
          )}
        </Panel.Content>
      </Panel>

      <ConfirmModal
        danger
        visible={isActivateConfirmModalVisible}
        title={`Are you sure you want to activate ${
          data?.customDomain.hostname ?? 'your custom hostname'
        }?`}
        description="Your existing supabase will be deactivated."
        buttonLabel="Activate"
        buttonLoadingLabel="Activating"
        onSelectCancel={() => setIsActivateConfirmModalVisible(false)}
        onSelectConfirm={onActivateCustomDomain}
      />
    </>
  )
}

export default observer(CustomDomainConfig)

type DNSRecordProps = {
  type: string
  name: string
  value: string
}

const DNSRecord = ({ type, name, value }: DNSRecordProps) => {
  return (
    <div className="flex gap-4">
      <Input
        label="Type"
        readOnly
        disabled
        className="input-mono"
        value={type.toUpperCase()}
        layout="vertical"
      />
      <Input
        label="Name"
        readOnly
        copy
        disabled
        className="input-mono flex-1"
        value={name}
        layout="vertical"
      />
      <Input
        label="Value"
        readOnly
        copy
        disabled
        className="input-mono flex-1"
        value={value}
        layout="vertical"
      />
    </div>
  )
}
