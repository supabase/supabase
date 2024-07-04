import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

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
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'
import { Collapsible, Form, IconChevronRight, Input, Toggle, cn } from 'ui'
import OrganizationDeletePanel from './OrganizationDeletePanel'

const GeneralSettings = () => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const selectedOrganization = useSelectedOrganization()
  const { name, opt_in_tags } = selectedOrganization ?? {}

  const formId = 'org-general-settings'
  const isOptedIntoAi = opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL)
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
                      descriptionText="By opting into sending anonymous data, Supabase AI can improve the answers it shows you"
                    />
                    <Collapsible open={open} onOpenChange={setOpen}>
                      <Collapsible.Trigger asChild>
                        <div className="flex items-center space-x-2 ml-16 cursor-pointer">
                          <IconChevronRight
                            strokeWidth={2}
                            size={16}
                            className={cn('transition-all', open ? 'rotate-90' : '')}
                          />
                          <p className="text-sm text-foreground-light underline">
                            Important information regarding opting in
                          </p>
                        </div>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <div className="space-y-2 py-4 ml-16 text-sm text-foreground-light">
                          <p>
                            Supabase AI is a chatbot support tool powered by OpenAI. Supabase will
                            share the query you submit and information about the databases you
                            manage through Supabase with OpenAI, L.L.C. and its affiliates in order
                            to provide the Supabase AI tool.
                          </p>
                          <p>
                            OpenAI will only access information about the structure of your
                            databases, such as table names, column and row headings. OpenAI will not
                            access the contents of the database itself.
                          </p>
                          <p>
                            OpenAI uses this information to generate responses to your query, and
                            does not retain or use the information to train its algorithms or
                            otherwise improve its products and services.
                          </p>
                          <p>
                            If you have your own individual account on Supabase, we will use any
                            personal information collected through [Supabase AI] to provide you with
                            the [Supabase AI] tool. If you are in the UK, EEA or Switzerland, the
                            processing of this personal information is necessary for the performance
                            of a contract between you and us.
                          </p>
                          <p>
                            Supabase collects information about the queries you submit through
                            Supabase AI and the responses you receive to assess the performance of
                            the Supabase AI tool and improve our services. If you are in the UK, EEA
                            or Switzerland, the processing is necessary for our legitimate
                            interests, namely informing our product development and improvement.
                          </p>
                          <p>
                            For more information about how we use personal information, please see
                            our{' '}
                            <Link
                              href="https://supabase.com/privacy"
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand border-b border-brand"
                            >
                              privacy policy
                            </Link>
                            .
                          </p>
                        </div>
                      </Collapsible.Content>
                    </Collapsible>
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
