import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import AlertError from 'components/ui/AlertError'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProjectMembersQuery } from 'data/projects/project-members-query'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
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
import * as z from 'zod'

import { summarizeProjectAccess, summarizeViewerProjectMembers } from './General.utils'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'

export const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { profile } = useProfile()

  const isBranch = Boolean(project?.parent_project_ref)
  const projectRef = project?.parent_project_ref ?? project?.ref

  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  const { can: canUpdateProject } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { mutate: updateProject, isPending: isUpdating } = useProjectUpdateMutation()
  const {
    data: projectMembers = [],
    error: projectMembersError,
    isPending: isLoadingProjectMembers,
    isError: isErrorProjectMembers,
  } = useProjectMembersQuery({ projectRef })
  const {
    data: organizationMembers = [],
    isSuccess: isSuccessOrganizationMembers,
    isPending: isLoadingOrganizationMembers,
  } = useOrganizationMembersQuery(
    { slug: organization?.slug },
    {
      enabled: !!organization?.slug,
    }
  )
  const {
    data: organizationRoles,
    isSuccess: isSuccessOrganizationRoles,
    isPending: isLoadingOrganizationRoles,
  } = useOrganizationRolesV2Query(
    { slug: organization?.slug },
    {
      enabled: !!organization?.slug,
    }
  )
  const {
    uniqueProjectMembers,
    projectMemberCount,
    organizationMemberCount,
    canCompareWithOrganizationMembers,
    hasOrganizationWideAccess,
  } = summarizeProjectAccess({
    projectMembers,
    organizationMembers,
    isSuccessOrganizationMembers,
  })

  const userMemberData = organizationMembers.find(
    (member) => member.gotrue_id === profile?.gotrue_id
  )
  const orgScopedRoleIds = new Set(
    (organizationRoles?.org_scoped_roles ?? []).map((role) => role.id)
  )
  const hasProjectScopedRoles = (organizationRoles?.project_scoped_roles ?? []).length > 0
  const isOrgScopedRole = orgScopedRoleIds.has(userMemberData?.role_ids?.[0] ?? -1)
  const hasLimitedVisibility = hasProjectScopedRoles && !isOrgScopedRole
  const { viewerVisibleMembers, viewerVisibleProjectMemberCount, viewerHiddenMembersCount } =
    summarizeViewerProjectMembers({
      uniqueProjectMembers,
      organizationMembers,
      hasLimitedVisibility,
    })
  const shouldShowOrgComparison = canCompareWithOrganizationMembers && !hasLimitedVisibility
  const isLoadingProjectAccess =
    isLoadingProjectMembers || isLoadingOrganizationMembers || isLoadingOrganizationRoles

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

      {!isBranch && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Project access</PageSectionTitle>
              <PageSectionDescription>
                View which members can access this project
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            {isErrorProjectMembers ? (
              <AlertError
                error={projectMembersError}
                subject="Failed to retrieve project members"
              />
            ) : (
              <Card>
                <CardContent>
                  {isLoadingProjectAccess ? (
                    <GenericSkeletonLoader />
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col @lg:flex-row @lg:items-center @lg:justify-between gap-3">
                        <div>
                          <p className="text-sm">
                            {hasLimitedVisibility
                              ? 'You have limited visibility in this organization'
                              : shouldShowOrgComparison && hasOrganizationWideAccess
                                ? 'All organization members can access this project'
                                : 'Restricted project access'}
                          </p>
                          <p className="text-sm text-foreground-light">
                            {hasLimitedVisibility
                              ? 'Your access is limited to specific projects, so you can’t see all members or settings.'
                              : shouldShowOrgComparison
                                ? hasOrganizationWideAccess
                                  ? `${organizationMemberCount} of ${organizationMemberCount} organization members can access this project.`
                                  : `${projectMemberCount} of ${organizationMemberCount} organization members can access this project.`
                                : `${projectMemberCount} project member${projectMemberCount === 1 ? '' : 's'} currently ${projectMemberCount === 1 ? 'has' : 'have'} access.`}
                          </p>
                          {hasLimitedVisibility && (
                            <p className="text-xs text-foreground-muted mt-1">
                              {viewerVisibleProjectMemberCount} project member
                              {viewerVisibleProjectMemberCount === 1 ? '' : 's'} visible to you.
                            </p>
                          )}
                          {!hasLimitedVisibility &&
                            !isLoadingOrganizationMembers &&
                            !canCompareWithOrganizationMembers && (
                              <p className="text-xs text-foreground-muted mt-1">
                                Organization-wide comparison is unavailable in your current access
                                scope.
                              </p>
                            )}
                        </div>
                        {!!organization?.slug && !hasLimitedVisibility && (
                          <Button asChild type="default">
                            <Link href={`/org/${organization.slug}/team`}>Manage members</Link>
                          </Button>
                        )}
                      </div>
                      {viewerVisibleProjectMemberCount > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {viewerVisibleMembers.map((member) => (
                            <span
                              key={member.user_id}
                              className="text-xs border rounded px-2 py-1 text-foreground-light bg-surface-200"
                            >
                              {member.primary_email}
                            </span>
                          ))}
                          {viewerHiddenMembersCount > 0 && (
                            <span className="text-xs border rounded px-2 py-1 text-foreground-light bg-surface-200">
                              +{viewerHiddenMembersCount} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </PageSectionContent>
        </PageSection>
      )}

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
