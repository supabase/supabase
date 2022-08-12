import { useContext, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Form, Input } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useFlag, useStore, checkPermissions } from 'hooks'
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

import { PageContext } from 'pages/org/[slug]/settings'

const GeneralSettings = observer(() => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)

  const formId = 'org-general-settings'
  const initialValues = {
    name: PageState.organization.name,
    billing_email: PageState.organization?.billing_email ?? '',
  }

  const enablePermissions = useFlag('enablePermissions')

  const canUpdateOrganization = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'organizations')
    : ui.selectedOrganization?.is_owner

  const canDeleteOrganization = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'organizations')
    : ui.selectedOrganization?.is_owner

  const canReadBillingEmail = checkPermissions(PermissionAction.READ, 'organizations')

  const onUpdateOrganization = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!canUpdateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to update this organization',
      })
    }

    setSubmitting(true)
    const response = await patch(`${API_URL}/organizations/${PageState.organization.slug}`, values)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      const { name, billing_email } = response
      resetForm({
        values: { name, billing_email },
        initialValues: { name, billing_email },
      })

      PageState.onOrgUpdated(response)
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
              name: PageState.organization.name,
              billing_email: PageState.organization?.billing_email ?? '',
            }
            resetForm({ values, initialValues: values })
          }, [PageState.organization.slug])

          return (
            <FormPanel
              footer={
                <div
                  className={`flex py-4 px-8 ${
                    canUpdateOrganization ? 'justify-end' : 'justify-between'
                  }`}
                >
                  {!canUpdateOrganization && (
                    <p className="text-sm text-scale-1000">
                      You need additional permissions to manage this organization's settings
                    </p>
                  )}
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
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
                  <Input
                    id="billing_email"
                    size="small"
                    label="Billing email"
                    type={canReadBillingEmail ? 'text' : 'password'}
                    disabled={!canUpdateOrganization}
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
})

export default GeneralSettings
