import { isEqual } from 'lodash'
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
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
  Toggle,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import { useGetRolesManagementPermissions } from '../TeamSettings.utils'
import { RolesAccessMatrix } from './RolesAccessMatrix'
import { ProjectRoleConfiguration, deriveChanges } from './UpdateRolesPanel.utils'
import { useOrganizationMemberUpdateMutation } from 'data/organization-members/organization-member-update-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'

interface UpdateRolesPanelProps {
  visible: boolean
  member: OrganizationMember
  onClose: () => void
}

// [Joshen] This is just scaffolding the UI logic, will need to change quite a bit to fit the API structure

export const UpdateRolesPanel = ({ visible, member, onClose }: UpdateRolesPanelProps) => {
  const { slug } = useParams()
  const organization = useSelectedOrganization()

  const { data: projects } = useProjectsQuery()
  const { data: permissions } = usePermissionsQuery()
  const { data } = useOrganizationRolesV2Query({ slug })
  const availableRoles = data?.org_scoped_roles ?? []

  // console.log(member)

  // const { rolesAddable, rolesRemovable } = useGetRolesManagementPermissions(
  //   organization?.id,
  //   availableRoles,
  //   permissions ?? []
  // )
  // console.log({ availableRoles, rolesAddable, rolesRemovable })

  const { mutateAsync: updateRole } = useOrganizationMemberUpdateMutation()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showRolesAccessMatrix, setShowRolesAccessMatrix] = useState(false)
  const [projectsRoleConfiguration, setProjectsRoleConfiguration] = useState<
    ProjectRoleConfiguration[]
  >([])

  const orgProjects = (projects ?? []).filter((p) => p.organization_id === organization?.id)
  const isApplyingRoleToAllProjects =
    projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0]?.ref === undefined
  const canSaveRoles = projectsRoleConfiguration.length > 0

  const lowerPermissionsRole = availableRoles.find((r) => r.name === 'Developer')?.id
  const sortByObject: any = ['Owner', 'Administrator', 'Developer'].reduce((obj, item, index) => {
    return { ...obj, [item]: index }
  }, {})
  const noAccessProjects = orgProjects.filter((project) => {
    return !projectsRoleConfiguration.some((p) => p.ref === project.ref)
  })

  const changesToRoles = deriveChanges(
    [{ ref: undefined, roleId: member.role_ids[0] }],
    projectsRoleConfiguration
  )

  const onSelectProject = (ref: string) => {
    setProjectsRoleConfiguration(
      projectsRoleConfiguration.concat({
        ref,
        roleId: lowerPermissionsRole ?? availableRoles[0].id,
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
            return { ref: p.ref, roleId: Number(value) }
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
      projectsRoleConfiguration[0]?.roleId ?? lowerPermissionsRole ?? availableRoles[0].id
    if (isApplyingRoleToAllProjects) {
      setProjectsRoleConfiguration(
        orgProjects.map((p) => {
          return { ref: p.ref, roleId: roleIdToApply }
        })
      )
    } else {
      setProjectsRoleConfiguration([{ ref: undefined, roleId: roleIdToApply }])
    }
  }

  const onConfirmUpdateMemberRoles = async () => {
    if (slug === undefined) return console.error('Slug is required')

    console.log(projectsRoleConfiguration)
    const gotrueId = member.gotrue_id
    const isOrgScope =
      projectsRoleConfiguration.length === 1 && projectsRoleConfiguration[0].ref === undefined

    // [Joshen TODO] Can we also debug why full page crash if payload is wrong e.g projects is [null]
    if (isOrgScope) {
      try {
        await updateRole({ slug, gotrueId, roleId: projectsRoleConfiguration[0].roleId })
        toast.success(`Successfully updated role for ${member.username}`)
        setShowConfirmation(false)
        onClose()
        return
      } catch (error: any) {
        return toast.error(`Failed to update role: ${error.message}`)
      }
    }

    const uniqueRoleIds = projectsRoleConfiguration.reduce((a, b) => {
      if (!a.includes(b.roleId)) return [...a, b.roleId]
      return a
    }, [] as number[])

    try {
      await Promise.all(
        uniqueRoleIds.map((roleId) => {
          updateRole({
            slug,
            gotrueId,
            roleId,
            projects: projectsRoleConfiguration
              .filter((p) => p.roleId === roleId)
              .map((p) => p.ref) as string[],
          })
        })
      )
    } catch (error: any) {
      return toast.error(`Failed to update role: ${error.message}`)
    }
  }

  useEffect(() => {
    // [Joshen] This is an assumption for the structure, and assumption for the UI that it starts with org level
    if (visible) {
      const roleId = member.role_ids[0]
      setProjectsRoleConfiguration([{ ref: undefined, roleId }])
    } else {
      setShowRolesAccessMatrix(false)
    }
  }, [visible])

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
              <p className="truncate" title={`Manage access for team member ${member.username}`}>
                Manage access for team member {member.username}
              </p>
              <Tooltip_Shadcn_ delayDuration={100}>
                <TooltipTrigger_Shadcn_ asChild>
                  <button
                    aria-expanded={showRolesAccessMatrix}
                    aria-controls="show-roles-matrix"
                    className={cn(
                      !showRolesAccessMatrix ? 'text-foreground-lighter' : 'text-light',
                      'mt-1 hover:text-foreground transition'
                    )}
                    onClick={() => setShowRolesAccessMatrix(!showRolesAccessMatrix)}
                  >
                    {!showRolesAccessMatrix ? (
                      <PanelLeftClose size={19} strokeWidth={1} />
                    ) : (
                      <PanelRightClose size={19} strokeWidth={1} />
                    )}
                  </button>
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="left">
                  {showRolesAccessMatrix ? 'Hide' : 'Show'} role permissions
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
            </SheetHeader>

            <SheetSection className="h-full overflow-auto flex flex-col gap-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">Apply roles to all projects in the organization</p>
                <Toggle
                  checked={isApplyingRoleToAllProjects}
                  onChange={onToggleApplyToAllProjects}
                  size="small"
                />
              </div>

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
                      This member will only have access to 3 projects in organization
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      {member.username} will not have access to the following{' '}
                      {noAccessProjects.length} project{noAccessProjects.length > 1 ? 's' : ''}:
                      <ul className="list-disc pl-6">
                        {noAccessProjects.map((project) => {
                          return <li key={project.id}>{project.name}</li>
                        })}
                      </ul>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}

              <div className="flex flex-col gap-y-2">
                {projectsRoleConfiguration.map((project) => {
                  const name =
                    project.ref === undefined
                      ? 'All projects'
                      : projects?.find((p) => p.ref === project.ref)?.name
                  const role = availableRoles.find((r) => r.id === project.roleId)

                  return (
                    <div
                      key={`${project.ref}-${project.roleId}`}
                      className="flex items-center justify-between"
                    >
                      <p className="text-sm">{name}</p>

                      <div className="flex items-center gap-x-2">
                        <Select_Shadcn_
                          disabled={false}
                          value={project.roleId.toString()}
                          onValueChange={(value) => onSelectRole(value, project)}
                        >
                          <SelectTrigger_Shadcn_ className="text-sm h-10 w-56">
                            {role?.name}
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {(availableRoles ?? [])
                                .sort((a, b) => sortByObject[a.name] - sortByObject[b.name])
                                .map((role) => (
                                  <SelectItem_Shadcn_
                                    key={role.id}
                                    value={role.id.toString()}
                                    className="text-sm"
                                  >
                                    {role.name}
                                  </SelectItem_Shadcn_>
                                ))}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>

                        {!isApplyingRoleToAllProjects && (
                          <Button
                            type="text"
                            className="px-1"
                            icon={<X size={14} />}
                            onClick={() => onRemoveProject(project?.ref)}
                          />
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
                  if (
                    isEqual(projectsRoleConfiguration, [
                      { ref: undefined, roleId: member.role_ids[0] },
                    ])
                  ) {
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

      <ConfirmationModal
        size="medium"
        visible={showConfirmation}
        title="Confirm to change roles of member"
        confirmLabel="Update roles"
        confirmLabelLoading="Updating"
        onCancel={() => setShowConfirmation(false)}
        onConfirm={onConfirmUpdateMemberRoles}
      >
        <div className="flex flex-col gap-y-3">
          <p className="text-sm text-foreground-light">
            You are making the following changes to the role of{' '}
            <span className="text-foreground">{member.username}</span> in the organization{' '}
            <span className="text-foreground">{organization?.name}</span>:
          </p>
          <div className="flex flex-col gap-y-2">
            {changesToRoles.removed.length !== 0 && (
              <div>
                <p className="text-sm">
                  Removing {changesToRoles.removed.length} role
                  {changesToRoles.removed.length > 1 ? 's' : ''} from user:
                </p>
                <ul className="list-disc pl-6">
                  {changesToRoles.removed.map((x, i) => {
                    const role = availableRoles.find((y) => y.id === x.roleId)
                    const project = orgProjects.find((y) => y.ref === x.ref)
                    return (
                      <li key={`update-${i}`} className="text-sm text-foreground-light">
                        <span className="text-foreground">{role?.name}</span> on{' '}
                        <span className={project !== undefined ? 'text-foreground' : ''}>
                          {project?.name ?? 'organization'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {changesToRoles.added.length !== 0 && (
              <div>
                <p className="text-sm">
                  Added {changesToRoles.added.length} role
                  {changesToRoles.added.length > 1 ? 's' : ''} from user:
                </p>
                <ul className="list-disc pl-6">
                  {changesToRoles.added.map((x, i) => {
                    const role = availableRoles.find((y) => y.id === x.roleId)
                    const project = orgProjects.find((y) => y.ref === x.ref)
                    return (
                      <li key={`update-${i}`} className="text-sm text-foreground-light">
                        <span className="text-foreground">{role?.name}</span> on{' '}
                        <span className={project !== undefined ? 'text-foreground' : ''}>
                          {project?.name ?? 'organization'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {changesToRoles.updated.length !== 0 && (
              <div>
                <p className="text-sm">
                  Updating {changesToRoles.updated.length} role
                  {changesToRoles.updated.length > 1 ? 's' : ''} from user:
                </p>
                <ul className="list-disc pl-6">
                  {changesToRoles.updated.map((x, i) => {
                    const originalRole = availableRoles.find((y) => y.id === x.originalRole)
                    const updatedRole = availableRoles.find((y) => y.id === x.updatedRole)
                    const project = orgProjects.find((y) => y.ref === x.ref)
                    return (
                      <li key={`update-${i}`} className="text-sm text-foreground-light">
                        From <span className="text-foreground">{originalRole?.name}</span> to{' '}
                        <span className="text-foreground">{updatedRole?.name}</span> on{' '}
                        <span className={project !== undefined ? 'text-foreground' : ''}>
                          {project?.name ?? 'organization'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
          <p className="text-sm text-foreground">
            By changing the role of this member their permissions will change.
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}
