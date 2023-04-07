import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Form, Input, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions } from 'hooks'
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
  const { name, opt_in_tags } = ui.selectedOrganization ?? {}

  const [optIn, setOptIn] = useState(
    opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ? true : false
  )
  const isOptedInToAI = opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN')

  useEffect(() => {
    setOptIn(isOptedInToAI ? true : false)
  }, [opt_in_tags])

  const formId = 'org-general-settings'

  const initialValues = {
    name: name ?? '',
    opt_in_tags: optIn,
  }

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

    const response = await patch(`${API_URL}/organizations/${slug}`, {
      ...values,
      opt_in_tags: optIn
        ? [...(ui.selectedOrganization?.opt_in_tags ?? []), 'AI_SQL_GENERATOR_OPT_IN']
        : [],
      billing_email: ui.selectedOrganization?.billing_email ?? '',
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      const { name, opt_in_tags } = response
      resetForm({
        values: { name, opt_in_tags },
        initialValues: { name, opt_in_tags },
      })

      app.onOrgUpdated(response)
      ui.setNotification({
        category: 'success',
        message: 'Successfully saved settings',
      })
    }
    setSubmitting(false)
  }

  return (
    <div className="container my-4 max-w-4xl space-y-8">
      <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganization}>
        {({ isSubmitting, handleReset, values, initialValues, resetForm }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          useEffect(() => {
            const values = {
              name: name ?? '',
              opt_in_tags: isOptedInToAI ?? false,
            }
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
                  <label htmlFor="name">Organization name</label>
                  <Input id="name" size="small" disabled={!canUpdateOrganization} />

                  <Toggle
                    checked={isOptedInToAI}
                    id="opt_in_tags"
                    name="opt_in_tags"
                    disabled={!canUpdateOrganization}
                    size="small"
                    onChange={() => setOptIn(!optIn)}
                    label="Opt-in to sending anonymous data to OpenAI"
                    descriptionText="You can choose to share anonymous metadata with OpenAI to enhance your experience on Supabase anywhere we use AI. Only information such as table schemas with table names, column names, and data types will be shared. None of your actual table data will be sent to OpenAI."
                  />
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
