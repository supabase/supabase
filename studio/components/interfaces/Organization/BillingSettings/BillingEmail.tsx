import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useParams } from 'common/hooks'
import { FormActions, FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { isResponseOk, patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Organization } from 'types'
import { Form, Input } from 'ui'

const BillingEmail = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const selectedOrganization = useSelectedOrganization()
  const { name, billing_email } = selectedOrganization ?? {}

  const formId = 'org-billing-email'
  const initialValues = {
    billing_email: billing_email ?? '',
  }

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const canReadBillingEmail = useCheckPermissions(PermissionAction.READ, 'organizations')
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const onUpdateOrganization = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!canUpdateOrganization) {
      return ui.setNotification({
        category: 'error',
        message: 'You do not have the required permissions to update this organization',
      })
    }

    if (!slug) return console.error('Slug is required')

    updateOrganization(
      { slug, billing_email: values.billing_email },
      {
        onSuccess: ({ billing_email }) => {
          resetForm({ values: { billing_email }, initialValues: { billing_email } })
          invalidateOrganizationsQuery(queryClient)
          ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
        },
      }
    )
  }

  return (
    <div className="container my-4">
      <h4>Billing email</h4>
      <p className="text-sm opacity-50">All billing correspondence will go to this email</p>

      <div className="mt-3">
        {selectedOrganization === undefined ? (
          <GenericSkeletonLoader />
        ) : (
          <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganization}>
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
        )}
      </div>
    </div>
  )
}

export default BillingEmail
