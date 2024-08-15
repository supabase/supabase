import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Form,
  IconAlertCircle,
  IconBarChart2,
  Input,
  WarningIcon,
} from 'ui'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

const General = () => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  // Also doubles up as a feature flag to enable display of the related alert,
  // another dedicated flag would be redundant.
  const v2AnnouncementUrl = useFlag('v2AnnouncementUrl') as string

  const v2MaintenanceWindow = project?.v2MaintenanceWindow
  const v2MaintenanceDate = v2MaintenanceWindow?.start
    ? new Date(v2MaintenanceWindow.start).toUTCString().slice(0, 16)
    : undefined
  const v2MaintenanceStartTime = v2MaintenanceWindow?.start?.substring(11, 16)
  const v2MaintenanceEndTime = v2MaintenanceWindow?.end?.substring(11, 16)

  const parentProject = useProjectByRef(project?.parent_project_ref)
  const isBranch = parentProject !== undefined

  const formId = 'project-general-settings'
  const initialValues = { name: project?.name ?? '', ref: project?.ref ?? '' }
  const canUpdateProject = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { mutate: updateProject, isLoading: isUpdating } = useProjectUpdateMutation()

  const onSubmit = async (values: any, { resetForm }: any) => {
    if (!project?.ref) return console.error('Ref is required')

    updateProject(
      { ref: project.ref, name: values.name.trim() },
      {
        onSuccess: ({ name }) => {
          resetForm({ values: { name }, initialValues: { name } })
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <div>
      {isBranch && (
        <Alert_Shadcn_ variant="default" className="mb-6">
          <WarningIcon />
          <AlertTitle_Shadcn_>
            You are currently on a preview branch of your project
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Certain settings are not available while you're on a preview branch. To adjust your
            project settings, you may return to your{' '}
            <Link href={`/project/${parentProject.ref}/settings/general`} className="text-brand">
              main branch
            </Link>
            .
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      {project === undefined ? (
        <GenericSkeletonLoader />
      ) : (
        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={!canUpdateProject}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdating}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      helper={
                        !canUpdateProject
                          ? "You need additional permissions to manage this project's settings"
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
                      label="Project name"
                      disabled={isBranch || !canUpdateProject}
                    />
                    <Input copy disabled id="ref" size="small" label="Reference ID" />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )
          }}
        </Form>
      )}
      {!isBranch && (
        <>
          <div className="mt-6" id="restart-project">
            <FormPanel>
              <div className="flex flex-col px-8 py-4">
                {v2MaintenanceStartTime &&
                  v2MaintenanceEndTime &&
                  v2AnnouncementUrl !== 'https://' && (
                    <Alert_Shadcn_ variant="warning" className="mb-4">
                      <IconAlertCircle strokeWidth={2} />
                      <AlertTitle_Shadcn_>Upcoming project restart scheduled</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                        This project will automatically restart on {v2MaintenanceDate} between{' '}
                        {v2MaintenanceStartTime} and {v2MaintenanceEndTime} UTC, which will cause up
                        to a few minutes of downtime.
                        <Collapsible_Shadcn_>
                          <CollapsibleTrigger_Shadcn_ className="text-foreground-light transition-all [&[data-state=open]&_svg]:rotate-90 hover:text-foreground data-[state=open]:text-foreground flex items-center gap-x-2 w-full">
                            <ChevronRight
                              className="transition-transform"
                              strokeWidth={1.5}
                              size={14}
                            />
                            Why this time?
                          </CollapsibleTrigger_Shadcn_>
                          <CollapsibleContent_Shadcn_>
                            Your project has historically had the least database queries across the
                            previous 10 weeks during this 30 minute window.
                          </CollapsibleContent_Shadcn_>
                        </Collapsible_Shadcn_>
                        You may also manually restart this project anytime before{' '}
                        {v2MaintenanceDate} {v2MaintenanceStartTime} UTC at a time that is
                        convenient for you.
                        <br />
                        <br />
                        <em>
                          <a
                            href={v2AnnouncementUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Find out more
                          </a>{' '}
                          about our v2 platform architecture migration.
                        </em>
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm">Restart project</p>
                    <div className="max-w-[420px]">
                      <p className="text-sm text-foreground-light">
                        Your project will not be available for a few minutes.
                      </p>
                    </div>
                  </div>
                  <RestartServerButton />
                </div>
              </div>
              <div
                className="flex w-full items-center justify-between px-8 py-4"
                id="pause-project"
              >
                <div>
                  <p className="text-sm">Pause project</p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be accessible while it is paused.
                    </p>
                  </div>
                </div>
                <PauseProjectButton />
              </div>
            </FormPanel>
          </div>
          <div className="mt-6">
            <Panel>
              <Panel.Content>
                <div className="flex justify-between">
                  <div className="flex space-x-4">
                    <IconBarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics has been moved</p>
                      <p className="text-foreground-light text-sm">
                        You may view your project's usage under your organization's settings
                      </p>
                    </div>
                  </div>
                  <div>
                    <Button asChild type="default">
                      <Link href={`/org/${organization?.slug}/usage?projectRef=${project?.ref}`}>
                        View project usage
                      </Link>
                    </Button>
                  </div>
                </div>
              </Panel.Content>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

export default General
