import { useEffect } from 'react'
import { Form, Input } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useStore, checkPermissions, useParams } from 'hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import { FormActions, FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'

const BillingEmail = () => {
  const { app, ui } = useStore()
  const { slug } = useParams()
  const { name, billing_email } = ui.selectedOrganization ?? {}

  const formId = 'org-billing-email'
  const initialValues = {
    billing_email: billing_email ?? '',
  }

  const canUpdateOrganization = checkPermissions(PermissionAction.UPDATE, 'organizations')
  const canReadBillingEmail = checkPermissions(PermissionAction.READ, 'organizations')

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
      name,
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      const { billing_email } = response
      resetForm({
        values: { billing_email },
        initialValues: { billing_email },
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
    <div className="container my-4 max-w-4xl">
      <h4>Billing email</h4>
      <p className="text-sm opacity-50">All billing correspondence will go to this email</p>

      <div className="mt-3">
        <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganization}>
          {({ isSubmitting, handleReset, values, initialValues, resetForm }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            useEffect(() => {
              const values = { billing_email: billing_email ?? '' }
              resetForm({ values, initialValues: values })
            }, [slug])

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
                <FormSection className="-mx-2">
                  <FormSectionContent loading={false}>
                    <Input
                      id="billing_email"
                      size="small"
                      label="Email address"
                      type={canReadBillingEmail ? 'text' : 'password'}
                      disabled={!canUpdateOrganization}
                    />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )
          }}
        </Form>
      </div>
    </div>
  )
}

export default BillingEmail
