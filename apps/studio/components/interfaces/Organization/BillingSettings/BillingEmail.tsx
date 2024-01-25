import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormActions, FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { Form, Input } from 'ui'

const BillingEmail = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const selectedOrganization = useSelectedOrganization()
  const { name, billing_email } = selectedOrganization ?? {}

  const formId = 'org-billing-email'
  const initialValues = { billing_email: billing_email ?? '' }

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const canReadBillingEmail = useCheckPermissions(PermissionAction.READ, 'organizations')
  const { mutateAsync: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const onUpdateOrganizationEmail = async (values: any, { resetForm }: any) => {
    if (!canUpdateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to update this organization',
      })
    }
    if (!slug) return console.error('Slug is required')
    if (!name) return console.error('Organization name is required')

    try {
      const { billing_email } = await updateOrganization({
        slug,
        name,
        billing_email: values.billing_email,
      })
      resetForm({ values: { billing_email }, initialValues: { billing_email } })
      invalidateOrganizationsQuery(queryClient)
      ui.setNotification({
        category: 'success',
        message: 'Successfully saved settings',
      })
    } finally {
    }
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-base m-0">Email Recipient</p>
          <p className="text-sm text-foreground-light m-0">
            All billing correspondence will go to this email
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganizationEmail}>
          {({ handleReset, values, initialValues, resetForm }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              const values = { billing_email: billing_email ?? '' }
              resetForm({ values, initialValues: values })
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [slug])

            return (
              <FormPanel
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdating}
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
                <FormSection>
                  <FormSectionContent fullWidth loading={false}>
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
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingEmail
