import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import NoProjectsOnPaidOrgInfo from 'components/interfaces/Billing/NoProjectsOnPaidOrgInfo'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'
import { Form, Input, Toggle } from 'ui'
import OptInToOpenAIToggle from './OptInToOpenAIToggle'
import OrganizationDeletePanel from './OrganizationDeletePanel'

const GeneralSettings = () => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const selectedOrganization = useSelectedOrganization()
  const { name } = selectedOrganization ?? {}

  const formId = 'org-general-settings'
  const isOptedIntoAi = useOrgOptedIntoAi()
  const initialValues = { name: name ?? '', isOptedIntoAi }

  const organizationDeletionEnabled = useIsFeatureEnabled('organizations:delete')

  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const canDeleteOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { mutate: updateOrganization, isLoading: isUpdating } = useOrganizationUpdateMutation()

  const onUpdateOrganization = async (values: any, { resetForm }: any) => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }

    if (!slug) return console.error('Slug is required')

    const existingOptInTags = selectedOrganization?.opt_in_tags ?? []
    const updatedOptInTags =
      values.isOptedIntoAi && !existingOptInTags.includes(OPT_IN_TAGS.AI_SQL)
        ? existingOptInTags.concat([OPT_IN_TAGS.AI_SQL])
        : !values.isOptedIntoAi && existingOptInTags.includes(OPT_IN_TAGS.AI_SQL)
          ? existingOptInTags.filter((x) => x !== OPT_IN_TAGS.AI_SQL)
          : existingOptInTags

    updateOrganization(
      { slug, name: values.name, opt_in_tags: updatedOptInTags },
      {
        onSuccess: () => {
          resetForm({ values, initialValues: values })
          invalidateOrganizationsQuery(queryClient)
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <ScaffoldContainerLegacy>
      <NoProjectsOnPaidOrgInfo organization={selectedOrganization} />

      <Form id={formId} initialValues={initialValues} onSubmit={onUpdateOrganization}>
        {({ handleReset, values, initialValues, resetForm }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          // [Alaister] although this "technically" is breaking the rules of React hooks
          // it won't error because the hooks are always rendered in the same order
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            const values = { name: name ?? '', isOptedIntoAi }
            resetForm({ values, initialValues: values })
          }, [selectedOrganization?.slug])

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
              <FormSection header={<FormSectionLabel>General settings</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input
                    id="name"
                    size="small"
                    label="Organization name"
                    disabled={!canUpdateOrganization}
                  />
                  <Input
                    copy
                    disabled
                    id="slug"
                    size="small"
                    label="Organization slug"
                    value={selectedOrganization?.slug}
                  />
                  <div className="mt-4">
                    <Toggle
                      id="isOptedIntoAi"
                      name="isOptedIntoAi"
                      disabled={!canUpdateOrganization}
                      size="small"
                      label="Opt-in to sending anonymous data to OpenAI"
                      descriptionText="By opting into sending anonymous data, Supabase AI can improve the answers it shows you. This is an organization-wide setting."
                    />

                    <OptInToOpenAIToggle className="ml-16" />
                  </div>
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          )
        }}
      </Form>

      {organizationDeletionEnabled && canDeleteOrganization && <OrganizationDeletePanel />}
    </ScaffoldContainerLegacy>
  )
}

export default GeneralSettings
