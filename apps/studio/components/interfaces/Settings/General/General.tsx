import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AlertCircle, BarChart2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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
  Input,
  WarningIcon,
} from 'ui'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

const General = () => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

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
                    <Input copy disabled id="ref" size="small" label="Project ID" />
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
                    <BarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics have been moved</p>
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
