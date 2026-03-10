import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

export const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const isBranch = Boolean(project?.parent_project_ref)

  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  const { can: canUpdateProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { mutate: updateProject, isPending: isUpdating } = useProjectUpdateMutation()

  const formSchema = z.object({
    name: z.string().trim().min(3, 'Project name must be at least 3 characters long'),
  })

  const defaultValues = { name: project?.name ?? '' }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values: defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!project?.ref) return console.error('Ref is required')

    updateProject(
      { ref: project.ref, name: values.name.trim() },
      {
        onSuccess: ({ name }) => {
          form.reset({ name })
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>General settings</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isBranch && (
            <Alert_Shadcn_ variant="default">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                You are currently on a preview branch of your project
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Certain settings are not available while you're on a preview branch. To adjust your
                project settings, you may return to your{' '}
                <Link
                  href={`/project/${project?.parent_project_ref}/settings/general`}
                  className="text-brand"
                >
                  main branch
                </Link>
                .
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {project === undefined ? (
            <GenericSkeletonLoader />
          ) : (
            <Form_Shadcn_ {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Project name"
                          description="Displayed throughout the dashboard."
                          className="[&>div]:md:w-1/2"
                        >
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              disabled={isBranch || !canUpdateProject}
                              autoComplete="off"
                            />
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Project ID"
                      description="Reference used in APIs and URLs."
                      className="[&>div]:md:w-1/2 [&>div>div]:md:w-full"
                    >
                      <FormControl_Shadcn_>
                        <Input copy readOnly size="small" value={project?.ref ?? ''} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  </CardContent>
                  <CardFooter className="justify-end space-x-2">
                    {form.formState.isDirty && (
                      <Button
                        type="default"
                        htmlType="button"
                        disabled={isUpdating}
                        onClick={() => form.reset({ name: project?.name ?? '' })}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={
                        !form.formState.isDirty || isUpdating || !canUpdateProject || isBranch
                      }
                      loading={isUpdating}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form_Shadcn_>
          )}
        </PageSectionContent>
      </PageSection>

      <PageSection id="restart-project">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Project availability</PageSectionTitle>
            <PageSectionDescription>
              Restart or pause your project when performing maintenance
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                <div>
                  <p className="text-sm">
                    {projectSettingsRestartProject ? 'Restart project' : 'Restart database'}
                  </p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be available for a few minutes.
                    </p>
                  </div>
                </div>
                <RestartServerButton />
              </div>
            </CardContent>
            <CardContent>
              <div
                className="flex w-full flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4"
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
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>

      {!isBranch && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Project usage</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent>
                <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                  <div className="flex space-x-4">
                    <BarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics have been moved</p>
                      <p className="text-foreground-light text-sm">
                        You may view your project's usage under your organization's settings
                      </p>
                    </div>
                  </div>

                  {!!organization && !!project && (
                    <Button asChild type="default">
                      <Link href={`/org/${organization.slug}/usage?projectRef=${project.ref}`}>
                        View project usage
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>
      )}
    </>
  )
}
