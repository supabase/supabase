import { useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Form, Input } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore } from 'hooks'
import { checkPermissions } from 'hooks/queries/usePermissionsQuery'
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

  const canUpdateOrganization = checkPermissions(
    PermissionAction.SQL_UPDATE,
    'postgres.public.organizations'
  )

  const onUpdateOrganization = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!canUpdateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have sufficient permissions to update your organization settings',
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
        {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
          return (
            <FormPanel
              disabled
              footer={
                <div className="flex justify-between py-4 px-8">
                  {!canUpdateOrganization && (
                    <p className="w-4/5 text-sm text-scale-1000">
                      You need additional permissions to manage your organization's settings
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
                    disabled={!canUpdateOrganization}
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          )
        }}
      </Form>

      {canUpdateOrganization && <OrganizationDeletePanel />}
    </div>
  )
})

export default GeneralSettings
