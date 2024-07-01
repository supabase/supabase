import { isEqual } from 'lodash'
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  Switch,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import { useGetRolesManagementPermissions } from '../TeamSettings.utils'
import { RolesAccessMatrix } from './RolesAccessMatrix'
import { UpdateRolesConfirmationModal } from './UpdateRolesConfirmationModal'
import {
  ProjectRoleConfiguration,
  formatMemberRoleToProjectRoleConfiguration,
} from './UpdateRolesPanel.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

interface UpdateRolesPanelProps {
  visible: boolean
  member: OrganizationMember
  onClose: () => void
}

export const UpdateRolesPanel = ({ visible, member, onClose }: UpdateRolesPanelProps) => {
  const { slug } = useParams()
  const organization = useSelectedOrganization()
  const projectLevelPermissionsEnabled = useFlag('projectLevelPermissions')

  const { data: projects } = useProjectsQuery()
  const { data: permissions } = usePermissionsQuery()
  const { data: allRoles, isSuccess: isSuccessRoles } = useOrganizationRolesV2Query({ slug })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })

  // [Joshen] We use the org scoped roles as the source for available roles
  const orgScopedRoles = allRoles?.org_scoped_roles ?? []
  const projectScopedRoles = allRoles?.project_scoped_roles ?? []
  const isEnterprise = subscription?.plan.id === 'enterprise'

  const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
    organization?.id,
    orgScopedRoles.concat(projectScopedRoles),
    permissions ?? []
  )
  const cannotAddAnyRoles = orgScopedRoles.every((r) => !rolesAddable.includes(r.id))

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showRolesAccessMatrix, setShowRolesAccessMatrix] = useState(false)
  const [projectsRoleConfiguration, setProjectsRoleConfiguration] = useState<
    ProjectRoleConfiguration[]
  >([])

  const originalConfiguration =
    allRoles !== undefined
      ? formatMemberRoleToProjectRoleConfiguration(member, allRoles, projects ?? [])
      : []
  const orgProjects = (projects ?? []).filter((p) => p.organization_id === organization?.id)
  const isApplyingRoleToAllProjects =
    projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0]?.ref === undefined
  const canSaveRoles = projectsRoleConfiguration.length > 0

  const lowerPermissionsRole = orgScopedRoles.find((r) => r.name === 'Developer')?.id
  const sortByObject: any = ['Owner', 'Administrator', 'Developer'].reduce((obj, item, index) => {
    return { ...obj, [item]: index }
  }, {})
  const noAccessProjects = orgProjects.filter((project) => {
    return !projectsRoleConfiguration.some((p) => p.ref === project.ref)
  })
  const numberOfProjectsWithAccess = orgProjects.length - noAccessProjects.length
  const numberOfAccessHasChanges = originalConfiguration.length !== noAccessProjects.length

  const onSelectProject = (ref: string) => {
    setProjectsRoleConfiguration(
      projectsRoleConfiguration.concat({
        ref,
        roleId: lowerPermissionsRole ?? orgScopedRoles[0].id,
      })
    )
    setShowProjectDropdown(false)
  }

  const onRemoveProject = (ref?: string) => {
    if (ref === undefined) return
    setProjectsRoleConfiguration(projectsRoleConfiguration.filter((p) => p.ref !== ref))
  }

  const onSelectRole = (value: string, project: ProjectRoleConfiguration) => {
    if (project.ref !== undefined) {
      setProjectsRoleConfiguration(
        projectsRoleConfiguration.map((p) => {
          if (p.ref === project.ref) {
            return { ref: p.ref, projectId: p.projectId, roleId: Number(value) }
          } else {
            return p
          }
        })
      )
    } else {
      setProjectsRoleConfiguration([{ ref: undefined, roleId: Number(value) }])
    }
  }

  const onToggleApplyToAllProjects = () => {
    const roleIdToApply =
      projectsRoleConfiguration[0]?.roleId ?? lowerPermissionsRole ?? orgScopedRoles[0].id
    if (isApplyingRoleToAllProjects) {
      setProjectsRoleConfiguration(
        orgProjects.map((p) => {
          return { ref: p.ref, projectId: p.id, roleId: roleIdToApply }
        })
      )
    } else {
      setProjectsRoleConfiguration([{ ref: undefined, roleId: roleIdToApply }])
    }
  }

  useEffect(() => {
    if (visible && isSuccessRoles) {
      const roleConfiguration = formatMemberRoleToProjectRoleConfiguration(
        member,
        allRoles,
        projects ?? []
      )
      setProjectsRoleConfiguration(roleConfiguration)
    } else {
      setShowRolesAccessMatrix(false)
    }
  }, [visible, isSuccessRoles])

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onClose()}>
        <SheetContent
          showClose={false}
          size={showRolesAccessMatrix ? 'lg' : 'default'}
          className={cn(
            'bg-surface-200 p-0 flex flex-row gap-0',
            showRolesAccessMatrix ? '!min-w-[1000px]' : '!min-w-[400px]'
          )}
        >
          <div className={cn('flex flex-col grow', showRolesAccessMatrix ? 'w-[48%]' : 'w-full')}>
            <SheetHeader
              className={cn('py-3 flex flex-row justify-between gap-x-4 items-center border-b')}
            >
              <p className="truncate" title={`Manage access for ${member.username}`}>
                Manage access for {member.username}
              </p>
              <Tooltip_Shadcn_ delayDuration={100}>
                <TooltipTrigger_Shadcn_ asChild>
                  <Button
                    type="outline"
                    className="[&>div]:text-foreground-light px-1.5"
                    icon={!showRolesAccessMatrix ? <PanelLeftClose /> : <PanelRightClose />}
                    onClick={() => setShowRolesAccessMatrix(!showRolesAccessMatrix)}
                  />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="left">
                  {showRolesAccessMatrix ? 'Hide' : 'Show'} role permissions
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
            </SheetHeader>

            <SheetSection className="h-full overflow-auto flex flex-col gap-y-4">
              {projectLevelPermissionsEnabled && isEnterprise && (
                <div className="flex items-center gap-x-4">
                  <Switch
                    disabled={cannotAddAnyRoles}
                    checked={isApplyingRoleToAllProjects}
                    onCheckedChange={onToggleApplyToAllProjects}
                  />
                  <p className="text-sm">Apply roles to all projects in the organization</p>
                </div>
              )}

              {projectsRoleConfiguration.length === 0 && (
                <Alert_Shadcn_>
                  <WarningIcon />
                  <AlertTitle_Shadcn_>
                    Team members need to be assigned at least one role
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    You may not remove all roles from a team member
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              {!isApplyingRoleToAllProjects &&
                projectsRoleConfiguration.length > 0 &&
                projectsRoleConfiguration.length !== orgProjects.length && (
                  <Alert_Shadcn_>
                    <AlertTitle_Shadcn_>
                      {numberOfAccessHasChanges
                        ? `This member will only have access to ${numberOfProjectsWithAccess} project${numberOfProjectsWithAccess > 1 ? 's' : ''}`
                        : `This member only has access to ${numberOfProjectsWithAccess} project${numberOfProjectsWithAccess > 1 ? 's' : ''}`}
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      {member.username} {numberOfAccessHasChanges ? 'will' : 'does'} not have access
                      to the following {noAccessProjects.length} project
                      {noAccessProjects.length > 1 ? 's' : ''}:
                      <ul className="list-disc pl-6">
                        {noAccessProjects.map((project) => {
                          return <li key={project.id}>{project.name}</li>
                        })}
                      </ul>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}

              <div className="flex flex-col gap-y-2">
                {projectsRoleConfiguration
                  .sort((a, b) => (a?.projectId ?? 0) - (b?.projectId ?? 0))
                  .map((project) => {
                    const name =
                      project.ref === undefined
                        ? 'All projects'
                        : projects?.find((p) => p.ref === project.ref)?.name
                    const role = orgScopedRoles.find((r) => {
                      if (project.baseRoleId !== undefined) return r.id === project.baseRoleId
                      else return r.id === project.roleId
                    })
                    const canRemoveRole = rolesRemovable.includes(role?.id ?? 0)

                    return (
                      <div
                        key={`${project.ref}-${project.roleId}`}
                        className="flex items-center justify-between"
                      >
                        <p className="text-sm">{name}</p>

                        <div className="flex items-center gap-x-2">
                          {cannotAddAnyRoles ? (
                            <Tooltip_Shadcn_>
                              <TooltipTrigger_Shadcn_ asChild>
                                <div className="flex items-center justify-between rounded-md border border-button bg-button px-3 py-2 text-sm h-10 w-56 text-foreground-light">
                                  {role?.name ?? 'Unknown'}
                                </div>
                              </TooltipTrigger_Shadcn_>
                              <TooltipContent_Shadcn_ side="bottom">
                                Additional permissions required to update role
                              </TooltipContent_Shadcn_>
                            </Tooltip_Shadcn_>
                          ) : (
                            <Select_Shadcn_
                              value={(project?.baseRoleId ?? project.roleId).toString()}
                              onValueChange={(value) => onSelectRole(value, project)}
                            >
                              <SelectTrigger_Shadcn_
                                className={cn(
                                  'text-sm h-10 w-56',
                                  role?.name === undefined && 'text-foreground-light'
                                )}
                              >
                                {role?.name ?? 'Please select a role'}
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  {(orgScopedRoles ?? [])
                                    .sort((a, b) => sortByObject[a.name] - sortByObject[b.name])
                                    .map((role) => {
                                      const canAssignRole = rolesAddable.includes(role.id)

                                      return (
                                        <SelectItem_Shadcn_
                                          key={role.id}
                                          value={role.id.toString()}
                                          className="text-sm"
                                          disabled={!canAssignRole}
                                        >
                                          {role.name}
                                        </SelectItem_Shadcn_>
                                      )
                                    })}
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          )}

                          {!isApplyingRoleToAllProjects && (
                            <Tooltip_Shadcn_>
                              <TooltipTrigger_Shadcn_ asChild>
                                <Button
                                  type="text"
                                  disabled={!canRemoveRole}
                                  className="px-1"
                                  icon={<X size={14} />}
                                  onClick={() => onRemoveProject(project?.ref)}
                                />
                              </TooltipTrigger_Shadcn_>
                              {!canRemoveRole && (
                                <TooltipContent_Shadcn_ side="bottom">
                                  Additional permission required to remove role from member
                                </TooltipContent_Shadcn_>
                              )}
                            </Tooltip_Shadcn_>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {!isApplyingRoleToAllProjects && (
                <Popover_Shadcn_
                  open={showProjectDropdown}
                  onOpenChange={setShowProjectDropdown}
                  modal={false}
                >
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button type="default" className="w-min">
                      Assign role to project
                    </Button>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
                    <Command_Shadcn_>
                      <CommandInput_Shadcn_ placeholder="Find project..." />
                      <CommandList_Shadcn_>
                        <CommandEmpty_Shadcn_>No projects found</CommandEmpty_Shadcn_>
                        <CommandGroup_Shadcn_>
                          <ScrollArea className={(projects || []).length > 7 ? 'h-[210px]' : ''}>
                            {orgProjects.map((project) => {
                              const hasRoleAssigned = projectsRoleConfiguration.some(
                                (p) => p.ref === project.ref
                              )
                              return (
                                <CommandItem_Shadcn_
                                  key={project.ref}
                                  disabled={hasRoleAssigned}
                                  className="cursor-pointer w-full justify-between"
                                  onSelect={() => onSelectProject(project.ref)}
                                  onClick={() => onSelectProject(project.ref)}
                                >
                                  <p className="truncate">{project.name}</p>
                                  {hasRoleAssigned && (
                                    <p className="w-[45%] text-right">Already assigned</p>
                                  )}
                                </CommandItem_Shadcn_>
                              )
                            })}
                          </ScrollArea>
                        </CommandGroup_Shadcn_>
                      </CommandList_Shadcn_>
                    </Command_Shadcn_>
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
              )}
            </SheetSection>

            <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
              <Button type="default" disabled={false} onClick={() => onClose()}>
                Cancel
              </Button>
              <Button
                loading={false}
                disabled={!canSaveRoles}
                onClick={() => {
                  if (isEqual(projectsRoleConfiguration, originalConfiguration)) {
                    onClose()
                  } else {
                    setShowConfirmation(true)
                  }
                }}
              >
                Save roles
              </Button>
            </SheetFooter>
          </div>

          {showRolesAccessMatrix && <RolesAccessMatrix visible={showRolesAccessMatrix} />}
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
