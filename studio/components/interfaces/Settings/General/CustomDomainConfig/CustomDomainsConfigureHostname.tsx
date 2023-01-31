import Link from 'next/link'
import * as yup from 'yup'
import { observer } from 'mobx-react-lite'
import { Button, Form, IconExternalLink, Input } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useParams, useStore } from 'hooks'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'

const schema = yup.object({
  domain: yup.string().required('A value for your custom domain is required'),
})

const CustomDomainsConfigureHostname = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const { mutateAsync: createCustomDomain } = useCustomDomainCreateMutation()
  const { data: settings } = useProjectSettingsQuery({ projectRef: ref })

  const FORM_ID = 'custom-domains-form'
  const endpoint = settings?.autoApiService.endpoint
  const canConfigureCustomDomain = checkPermissions(PermissionAction.UPDATE, 'projects')

  const verifyCNAME = async (domain: string): Promise<boolean> => {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${domain}`, {
      method: 'GET',
      headers: { accept: 'application/dns-json' },
    })
    const verification = await res.json()
    return verification.Status === 0
  }

  const onCreateCustomDomain = async (values: yup.InferType<typeof schema>) => {
    if (!ref) throw new Error('Project ref is required')

    const cnameVerified = await verifyCNAME(values.domain)
    if (!cnameVerified) {
      return ui.setNotification({
        category: 'error',
        message: `Your CNAME record for ${values.domain} cannot be found - if you've just added the CNAME record, do check back in a bit.`,
      })
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
              disabled={!canConfigureCustomDomain}
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
                      !canConfigureCustomDomain ? (
                        "You need additional permissions to update your project's custom domain settings"
                      ) : (
                        <Link href="https://supabase.com/docs/guides/platform/custom-domains">
                          <a target="_blank">
                            <Button type="default" icon={<IconExternalLink />}>
                              Documentation
                            </Button>
                          </a>
                        </Link>
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
                    disabled={!canConfigureCustomDomain}
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
                  )}
                  , resolving to{' '}
                  {endpoint ? (
                    <code className="text-xs">{endpoint}</code>
                  ) : (
                    "your project's API URL"
                  )}
                  , with as low a TTL as possible.
                </p>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default observer(CustomDomainsConfigureHostname)
