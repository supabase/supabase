import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Collapsible, Form, IconChevronRight, IconHelpCircle, Input, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions, useFlag } from 'hooks'
import { useParams } from 'common/hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'

import OrganizationDeletePanel from './OrganizationDeletePanel'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'

const GeneralSettings = () => {
  const { app, ui } = useStore()
  const { slug } = useParams()
  const [open, setOpen] = useState(false)
  const { name, opt_in_tags } = ui.selectedOrganization ?? {}

  const formId = 'org-general-settings'
  const isOptedIntoAi = opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN')
  const initialValues = { name: name ?? '', isOptedIntoAi }

  const showCMDK = useFlag('dashboardCmdk')
  const allowCMDKDataOptIn = useFlag('dashboardCmdkDataOptIn')

  const canUpdateOrganization = checkPermissions(PermissionAction.UPDATE, 'organizations')
  const canDeleteOrganization = checkPermissions(PermissionAction.UPDATE, 'organizations')

  const onUpdateOrganization = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!canUpdateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to update this organization',
      })
    }

    setSubmitting(true)

    // [Joshen] Need to update this logic once we support multiple opt in tags
    const optInTags = values.isOptedIntoAi ? ['AI_SQL_GENERATOR_OPT_IN'] : []
    const response = await patch(`${API_URL}/organizations/${slug}`, {
      name: values.name,
      billing_email: ui.selectedOrganization?.billing_email ?? '',
      ...(allowCMDKDataOptIn && { opt_in_tags: optInTags }),
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      resetForm({ values, initialValues: values })
      app.onOrgUpdated(response)
      ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
    }
    setSubmitting(false)
  }

  return (
    <div className="container my-4 max-w-4xl space-y-8">
      <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganization}>
        {({ isSubmitting, handleReset, values, initialValues, resetForm }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          useEffect(() => {
            const values = { name: name ?? '', isOptedIntoAi }
            resetForm({ values, initialValues: values })
          }, [ui.selectedOrganization?.slug])

          return (
            <FormPanel
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    helper={
                      !canUpdateOrganization
                        ? "You need additional permissions to manage this organization's settings"
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>General settings</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input
                    id="name"
                    size="small"
                    label="Organization name"
                    disabled={!canUpdateOrganization}
                  />
                  {showCMDK && allowCMDKDataOptIn && (
                    <div className="mt-4">
                      <Toggle
                        id="isOptedIntoAi"
                        name="isOptedIntoAi"
                        disabled={!canUpdateOrganization}
                        size="small"
                        label="Opt-in to sending anonymous data to OpenAI"
                        descriptionText="By opting into sending anonymous data, Supabase AI can improve the answers it shows you"
                      />
                      <Collapsible open={open} onOpenChange={setOpen}>
                        <Collapsible.Trigger asChild>
                          <div className="flex items-center space-x-2 ml-16 cursor-pointer">
                            <IconChevronRight
                              strokeWidth={2}
                              size={16}
                              className={clsx('transition-all', open ? 'rotate-90' : '')}
                            />
                            <p className="text-sm text-scale-1000 underline">
                              Important information regarding opting in
                            </p>
                          </div>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <div className="space-y-2 py-4 ml-16 text-sm text-scale-1100">
                            <p>
                              Supabase AI is a chatbot support tool powered by OpenAI. Supabase will
                              share the query you submit and information about the databases you
                              manage through Supabase with OpenAI, L.L.C. and its affiliates in
                              order to provide the Supabase AI tool.
                            </p>
                            <p>
                              OpenAI will only access information about the structure of your
                              databases, such as table names, column and row headings. OpenAI will
                              not access the contents of the database itself.
                            </p>
                            <p>
                              OpenAI uses this information to generate responses to your query, and
                              does not retain or use the information to train its algorithms or
                              otherwise improve its products and services.
                            </p>
                            <p>
                              If you have your own individual account on Supabase, we will use any
                              personal information collected through [Supabase AI] to provide you
                              with the [Supabase AI] tool. If you are in the UK, EEA or Switzerland,
                              the processing of this personal information is necessary for the
                              performance of a contract between you and us.
                            </p>
                            <p>
                              Supabase collects information about the queries you submit through
                              Supabase AI and the responses you receive to assess the performance of
                              the Supabase AI tool and improve our services. If you are in the UK,
                              EEA or Switzerland, the processing is necessary for our legitimate
                              interests, namely informing our product development and improvement.
                            </p>
                            <p>
                              For more information about how we use personal information, please see
                              our{' '}
                              <Link href="https://supabase.com/privacy">
                                <a
                                  target="_blank"
                                  className="text-brand-900 border-b border-brand-900"
                                >
                                  privacy policy
                                </a>
                              </Link>
                              .
                            </p>
                          </div>
                        </Collapsible.Content>
                      </Collapsible>
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          )
        }}
      </Form>

      {canDeleteOrganization && <OrganizationDeletePanel />}
    </div>
  )
}

export default observer(GeneralSettings)
