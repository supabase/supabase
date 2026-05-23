import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Input } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { AVAILABLE_REPLICA_REGIONS } from '../Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { ProjectAccessSection } from './ProjectAccessSection'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectUpdateMutation } from '@/data/projects/project-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const SELF_HOSTING_DOCS_URL = 'https://supabase.com/docs/guides/self-hosting'
const LOCAL_DEVELOPMENT_DOCS_URL = 'https://supabase.com/docs/guides/local-development'

export const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const isBranch = Boolean(project?.parent_project_ref)

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

  const regionLabel = AVAILABLE_REPLICA_REGIONS.find((region) =>
    project?.region?.includes(region.region)
  )

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

  if (!IS_PLATFORM) {
    return (
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>General settings</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {project === undefined ? (
            <Card>
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Project name"
                  description="Set via the DEFAULT_PROJECT_NAME environment variable."
                  className="[&>div]:md:w-1/2 [&>div>div]:md:w-full"
                >
                  <PasswordInput copy readOnly size="small" value={project.name ?? ''} />
                </FormItemLayout>
              </CardContent>
            </Card>
          )}
          <Admonition
            type="default"
            title="Managed via configuration variables"
            description={
              <>
                Project settings are configured outside of Studio. For self-hosted deployments see
                the <InlineLink href={SELF_HOSTING_DOCS_URL}>self-hosting guides</InlineLink>. For
                local development and the Supabase CLI see the{' '}
                <InlineLink href={LOCAL_DEVELOPMENT_DOCS_URL}>local development guides</InlineLink>.
              </>
            }
          />
        </PageSectionContent>
      </PageSection>
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
            <Admonition
              type="default"
              className="mb-4"
              title="You are currently on a preview branch of your project"
            >
              Certain settings are not available while you're on a preview branch. To adjust your
              project settings, you may return to your{' '}
              <InlineLink href={`/project/${project?.parent_project_ref}/settings/general`}>
                main branch
              </InlineLink>
              .
            </Admonition>
          )}

          {project === undefined ? (
            <Card>
              <CardContent>
                <GenericSkeletonLoader />
              </CardContent>
            </Card>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Project name"
                          description="Displayed throughout the dashboard."
                          className="[&>div]:md:w-1/2"
                        >
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isBranch || !canUpdateProject}
                              autoComplete="off"
                            />
                          </FormControl>
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
                      <FormControl>
                        <PasswordInput copy readOnly size="small" value={project.ref} />
                      </FormControl>
                    </FormItemLayout>
                  </CardContent>

                  <CardContent>
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Project region"
                      description={regionLabel?.name}
                      className="[&>div]:md:w-1/2 [&>div>div]:md:w-full"
                    >
                      <FormControl>
                        <PasswordInput copy readOnly size="small" value={project.region} />
                      </FormControl>
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
            </Form>
          )}
        </PageSectionContent>
      </PageSection>

      <ProjectAccessSection />
    </>
  )
}
