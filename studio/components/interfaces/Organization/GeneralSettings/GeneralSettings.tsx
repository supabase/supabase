import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Form, Input } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions, useParams } from 'hooks'
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

  const formId = 'org-general-settings'
  const initialValues = { name: ui.selectedOrganization?.name ?? '' }
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
      billing_email: ui.selectedOrganization?.billing_email ?? '',
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      const { name } = response
      resetForm({
        values: { name },
        initialValues: { name },
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
            const values = { name: ui.selectedOrganization?.name ?? '' }
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
              <FormSection header={<FormSectionLabel>Organization name</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input id="name" size="small" disabled={!canUpdateOrganization} />
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
