import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { FormActions, FormPanel, FormSection, FormSectionContent } from 'components/ui/Forms'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import { Form, Input } from 'ui'
import NoPermission from 'components/ui/NoPermission'

const BillingEmail = () => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const queryClient = useQueryClient()
  const selectedOrganization = useSelectedOrganization()
  const { name, billing_email } = selectedOrganization ?? {}

  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles } = useOrganizationRolesV2Query({ slug })
  const orgScopedRoles = (allRoles?.org_scoped_roles ?? []).sort(
    (a, b) => b.base_role_id - a.base_role_id
  )
  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

  const formId = 'org-billing-email'
  const initialValues = { billing_email: billing_email ?? '' }

  const canUpdateOrganization =
    useCheckPermissions(PermissionAction.UPDATE, 'organizations') && hasOrgRole
  const canReadBillingEmail =
    useCheckPermissions(PermissionAction.READ, 'organizations') && hasOrgRole
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const onUpdateOrganizationEmail = async (values: any, { resetForm }: any) => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }
    if (!slug) return console.error('Slug is required')
    if (!name) return console.error('Organization name is required')

    updateOrganization(
      {
        slug,
        name,
        billing_email: values.billing_email,
      },
      {
        onSuccess: ({ billing_email }) => {
          resetForm({ values: { billing_email }, initialValues: { billing_email } })
          invalidateOrganizationsQuery(queryClient)
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Email Recipient</p>
          <p className="text-sm text-foreground-light m-0">
            All billing correspondence will go to this email
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadBillingEmail ? (
          <NoPermission resourceText="view this organization's billing email" />
        ) : (
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
                        type="text"
                        disabled={!canUpdateOrganization}
                      />
                    </FormSectionContent>
                  </FormSection>
                </FormPanel>
              )
            }}
          </Form>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingEmail
