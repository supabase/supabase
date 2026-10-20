import { useParams } from 'common'
import { PlusIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  cn,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ROLE_DESCRIPTIONS } from '../Roles.constants'
import { useGetRolesManagementPermissions } from '../TeamSettings.utils'
import { UpdateRolesConfirmationModal } from './UpdateRolesConfirmationModal'
import {
  formatMemberRoleToProjectRoleConfiguration,
  hasRoleConfigurationChanges,
  ProjectRoleConfiguration,
} from './UpdateRolesPanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { OrganizationProjectsMultiSelect } from '@/components/ui/OrganizationProjectsMultiSelect'
import { useOrganizationRolesV2Query } from '@/data/organization-members/organization-roles-query'
import { OrganizationMember } from '@/data/organizations/organization-members-query'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useHasAccessToProjectLevelPermissions } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

interface UpdateRolesPanelProps {
  visible: boolean
  member: OrganizationMember
  onClose: () => void
}

export const UpdateRolesPanel = ({ visible, member, onClose }: UpdateRolesPanelProps) => {
  const { slug } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const isOptedIntoProjectLevelPermissions = useHasAccessToProjectLevelPermissions(slug as string)

  const { data: permissions } = usePermissionsQuery()
  const { data: allRoles, isSuccess: isSuccessRoles } = useOrganizationRolesV2Query({ slug })

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const totalNumOrgProjects = projectsData?.pages[0].pagination.count ?? 0

  // [Joshen] We use the org scoped roles as the source for available roles
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []
  const projectScopedRoles = allRoles?.project_scoped_roles ?? []

  const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
    organization?.slug,
    orgScopedRoles.concat(projectScopedRoles),
    permissions ?? []
  )
  const cannotAddAnyRoles = orgScopedRoles.every((r) => !rolesAddable.includes(r.id))
  const isStripeProjectsOrg = organization?.managed_by === MANAGED_BY.STRIPE_PROJECTS

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [projectsRoleConfiguration, setProjectsRoleConfiguration] = useState<
    ProjectRoleConfiguration[]
  >([])

  const originalConfiguration =
    allRoles !== undefined ? formatMemberRoleToProjectRoleConfiguration(member, allRoles) : []
  const originalConfigurationType =
    originalConfiguration.length === 1 &&
    !!orgScopedRoles.find((r) => r.id === originalConfiguration[0].roleId)
      ? 'org-scope'
      : 'project-scope'

  const isApplyingRoleToAllProjects =
    projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0]?.ref === undefined
  const canSaveRoles = projectsRoleConfiguration.length > 0

  const lowerPermissionsRole = orgScopedRoles.find((r) => r.name === 'Developer')?.id

  const numberOfProjectsWithAccess = projectsRoleConfiguration.filter(
    (p) => p.ref !== undefined
  ).length
  const hasNoChanges = !hasRoleConfigurationChanges(
    originalConfiguration,
    projectsRoleConfiguration
  )

  const getRoleForProject = (project: ProjectRoleConfiguration) =>
    orgScopedRoles.find((r) => r.id === (project.baseRoleId ?? project.roleId))

  const projectsWithRef = projectsRoleConfiguration.filter(
    (p): p is ProjectRoleConfiguration & { ref: string } => p.ref !== undefined
  )
  const selectedRefs = projectsWithRef.map((p) => p.ref)
  const knownProjects = projectsWithRef.map((p) => ({ ref: p.ref, name: p.name ?? p.ref }))
  const disabledRefs = projectsWithRef
    .filter((p) => !rolesRemovable.includes(getRoleForProject(p)?.id ?? 0))
    .map((p) => p.ref)

  const onRemoveProject = (ref?: string) => {
    if (ref === undefined) return
    setProjectsRoleConfiguration(projectsRoleConfiguration.filter((p) => p.ref !== ref))
  }

  const onProjectSelectionChange = (refs: string[], selected: { ref: string; name: string }[]) => {
    const removedRefs = selectedRefs.filter((ref) => !refs.includes(ref))
    const addedProjects = selected.filter((p) => !selectedRefs.includes(p.ref))
    const roleIdToApply = lowerPermissionsRole ?? orgScopedRoles[0].id

    setProjectsRoleConfiguration(
      projectsRoleConfiguration
        .filter((p) => p.ref === undefined || !removedRefs.includes(p.ref))
        .concat(addedProjects.map((p) => ({ ref: p.ref, name: p.name, roleId: roleIdToApply })))
    )
  }

  const onSelectRole = (value: string, project: ProjectRoleConfiguration) => {
    if (project.ref !== undefined) {
      setProjectsRoleConfiguration(
        projectsRoleConfiguration.map((p) => {
          if (p.ref === project.ref) {
            return { ref: p.ref, name: p.name, roleId: Number(value) }
          } else {
            return p
          }
        })
      )
    } else {
      setProjectsRoleConfiguration([{ ref: undefined, roleId: Number(value) }])
    }
  }

  const onToggleApplyToAllProjects = (isApplyAllProjects: boolean) => {
    const roleIdToApply = lowerPermissionsRole ?? orgScopedRoles[0].id

    if (isApplyAllProjects) {
      if (originalConfigurationType === 'org-scope') {
        setProjectsRoleConfiguration(originalConfiguration)
      } else {
        setProjectsRoleConfiguration([{ ref: undefined, name: undefined, roleId: roleIdToApply }])
      }
    } else {
      if (originalConfigurationType === 'project-scope') {
        setProjectsRoleConfiguration(originalConfiguration)
      } else {
        setProjectsRoleConfiguration([])
      }
    }
  }

  useEffect(() => {
    if (visible && isSuccessRoles) {
      const roleConfiguration = formatMemberRoleToProjectRoleConfiguration(member, allRoles)
      setProjectsRoleConfiguration(roleConfiguration)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isSuccessRoles])

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onClose()}>
        <SheetContent
          showClose={false}
          size="default"
          className="p-0 flex flex-row gap-0 md:w-[600px] lg:w-[600px] w-full"
        >
          <div className="flex flex-col grow w-full">
            <SheetHeader className="py-3 flex flex-row justify-between gap-x-4 items-center border-b bg-transparent">
              <p className="truncate" title={`Manage access for ${member.username}`}>
                Manage access for {member.username}
              </p>
              <DocsButton href={`${DOCS_URL}/guides/platform/access-control`} />
            </SheetHeader>

            <SheetSection className="h-full overflow-auto flex flex-col gap-y-4">
              {isOptedIntoProjectLevelPermissions && (
                <div className="flex items-center justify-between gap-x-4">
                  <div className="flex items-center gap-x-4">
                    <Switch
                      disabled={cannotAddAnyRoles}
                      checked={isApplyingRoleToAllProjects}
                      onCheckedChange={onToggleApplyToAllProjects}
                    />
                    <p className="text-sm">Apply roles to all projects in the organization</p>
                  </div>
                  {isSuccessRoles && !isApplyingRoleToAllProjects && (
                    <OrganizationProjectsMultiSelect
                      selectedRefs={selectedRefs}
                      onChange={onProjectSelectionChange}
                      knownProjects={knownProjects}
                      disabledRefs={disabledRefs}
                      disabledTooltip="Additional permission required to remove role from member"
                      renderTrigger={() => (
                        <Button type="button" variant="primary" icon={<PlusIcon size={14} />}>
                          Add new
                        </Button>
                      )}
                    />
                  )}
                </div>
              )}

              {projectsRoleConfiguration.length === 0 && (
                <Alert>
                  <WarningIcon />
                  <AlertTitle>Team members need to be assigned at least one role</AlertTitle>
                  <AlertDescription>
                    You may not remove all roles from a team member
                  </AlertDescription>
                </Alert>
              )}

              {!isApplyingRoleToAllProjects &&
                projectsRoleConfiguration.length > 0 &&
                projectsRoleConfiguration.length < totalNumOrgProjects && (
                  <Admonition>
                    <span className="text-sm">
                      {hasNoChanges
                        ? `This member only has access to ${numberOfProjectsWithAccess} project${numberOfProjectsWithAccess > 1 ? 's' : ''} out of ${totalNumOrgProjects} total project${totalNumOrgProjects > 1 ? 's' : ''}.`
                        : `This member will only have access to ${numberOfProjectsWithAccess} project${numberOfProjectsWithAccess > 1 ? 's' : ''} out of ${totalNumOrgProjects} total project${totalNumOrgProjects > 1 ? 's' : ''}.`}
                    </span>
                  </Admonition>
                )}

              <Card className="overflow-hidden">
                <div className="flex flex-col divide-y divide-border">
                  {projectsRoleConfiguration.map((project) => {
                    const name = project.ref === undefined ? 'All projects' : project.name
                    const role = getRoleForProject(project)
                    const canRemoveRole = rolesRemovable.includes(role?.id ?? 0)

                    return (
                      <div
                        key={`${project.ref}-${project.roleId}`}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <p className="text-sm">{name}</p>

                        <div className="flex items-center gap-x-2">
                          {cannotAddAnyRoles ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-between rounded-md border border-button bg-button px-3 py-2 text-sm h-10 w-56 text-foreground-light">
                                  {role?.name ?? 'Unknown'}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Additional permissions required to update role
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Select
                              value={(project?.baseRoleId ?? project.roleId).toString()}
                              onValueChange={(value) => onSelectRole(value, project)}
                            >
                              <SelectTrigger
                                className={cn(
                                  ' w-40',
                                  role?.name === undefined && 'text-foreground-light'
                                )}
                              >
                                {role?.name ?? 'Please select a role'}
                              </SelectTrigger>
                              <SelectContent align="end" className="max-h-[32rem]">
                                <SelectGroup>
                                  {(orgScopedRoles ?? []).map((role) => {
                                    const canAssignRole = rolesAddable.includes(role.id)
                                    const isOwnerRole = role.name === 'Owner'
                                    const disabledForStripe = isStripeProjectsOrg && isOwnerRole

                                    const isNoAccessRole = role.name === 'No-access'
                                    const disabledForProjectRole =
                                      !isApplyingRoleToAllProjects && isNoAccessRole
                                    const disabled =
                                      !canAssignRole || disabledForStripe || disabledForProjectRole
                                    const disabledReason = disabledForStripe
                                      ? 'Cannot be assigned in Stripe Projects organizations'
                                      : disabledForProjectRole
                                        ? 'Cannot assign No-access role to project-scoped members'
                                        : !canAssignRole
                                          ? 'Additional permissions required to assign role'
                                          : undefined

                                    return (
                                      <SelectItem
                                        key={role.id}
                                        value={role.id.toString()}
                                        className="text-sm hover:bg-selection cursor-pointer"
                                        disabled={disabled}
                                      >
                                        <div className="flex flex-col gap-0.5 max-w-xs">
                                          <span>{role.name}</span>
                                          <span className="text-xs text-foreground-lighter">
                                            {ROLE_DESCRIPTIONS[role.name] ??
                                              'Permissions are based on the configured organization role.'}
                                            {disabledReason && ` ${disabledReason}`}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}

                          {!isApplyingRoleToAllProjects && (
                            <ButtonTooltip
                              variant="text"
                              disabled={!canRemoveRole}
                              className="px-1"
                              icon={<XIcon />}
                              onClick={() => onRemoveProject(project?.ref)}
                              tooltip={{
                                content: {
                                  side: 'bottom',
                                  text: !canRemoveRole
                                    ? 'Additional permission required to remove role from member'
                                    : 'Remove access to project',
                                },
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </SheetSection>

            <SheetFooter className="flex items-center justify-end! px-5 py-4 w-full border-t">
              <Button disabled={false} onClick={() => onClose()}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={false}
                disabled={!canSaveRoles || hasNoChanges}
                onClick={() => {
                  setShowConfirmation(true)
                }}
              >
                Save roles
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <UpdateRolesConfirmationModal
        visible={showConfirmation}
        member={member}
        projectsRoleConfiguration={projectsRoleConfiguration}
        onClose={(success) => {
          setShowConfirmation(false)
          if (success) onClose()
        }}
      />
    </>
  )
}
