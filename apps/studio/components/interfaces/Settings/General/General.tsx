import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { toast } from 'sonner'

import { FormActions } from 'components/ui/Forms/FormActions'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProjectByRefQuery, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { Input } from 'ui-patterns/DataInputs/Input'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

const schema = z.object({
  name: z
    .string({ message: 'Please enter a project name.' })
    .trim()
    .min(3, 'Project name must be at least 3 characters long.')
    .max(64, 'Project name must be no longer than 64 characters.'),
})

const formId = 'project-general-settings'

export const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: parentProject } = useProjectByRefQuery(project?.parent_project_ref)
  const { can: canUpdateProject } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )
  const isBranch = parentProject !== undefined
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
    // when `useSelectedProjectQuery finishes loading, it will update
    // this value
    values: { name: project?.name ?? '' },
  })

  const { mutate: updateProject } = useProjectUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ name }) => {
    if (!project?.ref) return console.error('Ref is required')

    updateProject(
      { ref: project.ref, name },
      {
        onSuccess: ({ name }) => {
          form.reset({ name }, { keepValues: true })
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <ScaffoldSection className="gap-6">
      <ScaffoldSectionTitle>General settings</ScaffoldSectionTitle>
      {isBranch && (
        <Alert_Shadcn_ variant="default">
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

      <Card>
        {project === undefined ? (
          <CardContent>
            <GenericSkeletonLoader />
          </CardContent>
        ) : (
          <>
            <CardHeader>Project Details</CardHeader>
            <CardContent>
              <Form_Shadcn_ {...form}>
                <form
                  id={formId}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <FormField_Shadcn_
                    key="name"
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="name" label="Project name">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            id="name"
                            disabled={isBranch || !canUpdateProject}
                            {...field}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  <FormLayout label="Project ID">
                    <Input id="ref" size="small" value={project.ref} copy disabled />
                  </FormLayout>
                </form>
              </Form_Shadcn_>
            </CardContent>
            <CardFooter>
              <FormActions
                form={formId}
                isSubmitting={form.formState.isSubmitting}
                hasChanges={form.formState.isDirty}
                handleReset={form.reset}
                helper={
                  !canUpdateProject
                    ? "You need additional permissions to manage this project's settings"
                    : undefined
                }
              />
            </CardFooter>
          </>
        )}
      </Card>

      {!isBranch && (
        <>
          <Card>
            <CardContent id="restart-project" className="flex justify-between items-center">
              <div>
                <p className="text-sm">Restart project</p>
                <div className="max-w-[420px]">
                  <p className="text-sm text-foreground-light">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
              </div>
              <RestartServerButton />
            </CardContent>
            <CardContent id="pause-project" className="flex justify-between items-center">
              <div>
                <p className="text-sm">Pause project</p>
                <div className="max-w-[420px]">
                  <p className="text-sm text-foreground-light">
                    Your project will not be accessible while it is paused.
                  </p>
                </div>
              </div>
              <PauseProjectButton />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex justify-between items-center">
              <div className="flex space-x-4">
                <BarChart2 strokeWidth={2} />
                <div>
                  <p className="text-sm">Project usage statistics have been moved</p>
                  <p className="text-foreground-light text-sm">
                    You may view your project's usage under your organization's settings
                  </p>
                </div>
              </div>
              <Button asChild type="default">
                <Link href={`/org/${organization?.slug}/usage?projectRef=${project?.ref}`}>
                  View project usage
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </ScaffoldSection>
  )
}
