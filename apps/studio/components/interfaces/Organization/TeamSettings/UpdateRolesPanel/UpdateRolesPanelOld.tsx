import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Role } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  WarningIcon,
  cn,
} from 'ui'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'

interface UpdateRolesPanelProps {
  visible: boolean
  member: OrganizationMember
  onClose: () => void
}

// [Joshen] This is just scaffolding the UI logic, will need to change quite a bit to fit the API structure
// [Joshen] Keeping this for now, but once everything is ready we can deprecate this file, no one is using

export const UpdateRolesPanel = ({ visible, member, onClose }: UpdateRolesPanelProps) => {
  const { slug } = useParams()
  const organization = useSelectedOrganization()
  const { data } = useOrganizationRolesQuery({ slug })
  const { data: projects } = useProjectsQuery()

  const [roleConfiguration, setRoleConfiguration] = useState<
    { id: number; name: string; projects: string[] }[]
  >([])

  // [Joshen] If any roles are applied to ALL projects, or there are overlapping projects across roles
  const hasMoreThanOneRoleForAllProjects =
    roleConfiguration.some((r) => r.projects.length === 0) && roleConfiguration.length > 1
  const selectedProjectsAcrossRoles = roleConfiguration.reduce((obj, item) => {
    return obj.concat(item.projects)
  }, [] as string[])
  const hasOverlappingProjects =
    new Set(selectedProjectsAcrossRoles).size !== selectedProjectsAcrossRoles.length
  const canSaveRoles =
    roleConfiguration.length > 0 && !hasOverlappingProjects && !hasMoreThanOneRoleForAllProjects

  const availableRoles = data?.roles ?? []
  const appliedRoles = member.role_ids
    .map((id) => {
      return availableRoles.find((y) => id === y.id)
    })
    .filter((x) => x !== undefined) as Role[]

  const sortByObject: any = ['Owner', 'Administrator', 'Developer'].reduce((obj, item, index) => {
    return { ...obj, [item]: index }
  }, {})

  const onAddRole = (role: Role) => {
    const updatedConfiguration = roleConfiguration.concat({ ...role, projects: [] })
    setRoleConfiguration(
      updatedConfiguration.sort((a, b) => sortByObject[a.name] - sortByObject[b.name])
    )
  }

  const onRemoveRole = (role: Role) => {
    setRoleConfiguration(roleConfiguration.filter((r) => r.id !== role.id))
  }

  const onUpdateRole = (role: Role, projects: string[]) => {
    const updatedConfiguration = roleConfiguration.map((r) => {
      if (role.id === r.id) {
        return { ...r, projects }
      } else {
        return r
      }
    })
    setRoleConfiguration(updatedConfiguration)
  }

  useEffect(() => {
    // [Joshen] This is an assumption for the structure
    if (visible) {
      setRoleConfiguration(
        appliedRoles.map((role) => {
          return { ...role, projects: [] }
        })
      )
    }
  }, [visible])

  return (
    <Sheet open={visible} onOpenChange={() => onClose()}>
      <SheetContent
        showClose={false}
        size="default"
        className={cn('bg-surface-200 p-0 flex flex-row gap-0 !min-w-[400px]')}
      >
        <div className={cn('flex flex-col grow w-full')}>
          <SheetHeader className={cn('py-3 flex flex-row justify-between items-center border-b')}>
            <p>Manage access for team member</p>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/platform/access-control"
              >
                Documentation
              </a>
            </Button>
          </SheetHeader>

          <div className="h-full flex flex-col gap-y-4 px-5 py-5">
            <p className="text-sm">
              Manage access for {member.username} to each project under {organization?.name}
            </p>

            {(hasOverlappingProjects || hasMoreThanOneRoleForAllProjects) && (
              <Alert_Shadcn_ variant="warning">
                <WarningIcon />
                <AlertTitle_Shadcn_>
                  Members cannot be assigned multiple roles on a project
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Ensure that the member has at most one role assigned for each project
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            {roleConfiguration.length === 0 && (
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

            {roleConfiguration.map((role) => {
              const selectedProjects =
                roleConfiguration.find((r) => r.id === role.id)?.projects ?? []

              return (
                <div
                  key={role.name}
                  className="flex flex-col border border-control rounded gap-y-2 px-3 py-3 bg-surface-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{role.name}</p>
                    <div className="flex items-center gap-x-2">
                      {role.projects.length > 0 && (
                        <Button type="default" onClick={() => onUpdateRole(role, [])}>
                          Apply to all projects
                        </Button>
                      )}
                      <Button type="default" onClick={() => onRemoveRole(role)}>
                        Remove role
                      </Button>
                    </div>
                  </div>
                  <MultiSelectV2
                    options={(projects ?? []).map((project) => {
                      return {
                        id: project.id,
                        name: project.name,
                        value: project.ref,
                        disabled: false,
                      }
                    })}
                    value={selectedProjects}
                    placeholder="All projects"
                    searchPlaceholder="Search for a project"
                    onChange={(projects) => onUpdateRole(role, projects)}
                  />
                </div>
              )
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="w-min">
                  Assign a new role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                {availableRoles
                  .sort((a, b) => sortByObject[a.name] - sortByObject[b.name])
                  .map((role) => {
                    const alreadyAssigned = roleConfiguration.map((x) => x.id).includes(role.id)
                    return (
                      <DropdownMenuItem
                        key={role.id}
                        disabled={alreadyAssigned}
                        className="flex items-center justify-between"
                        onClick={() => onAddRole(role)}
                      >
                        <span className="text-foreground">{role.name}</span>
                        {alreadyAssigned && (
                          <span className="text-foreground-light">Already assigned</span>
                        )}
                      </DropdownMenuItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
            <Button type="default" disabled={false} onClick={() => onClose()}>
              Cancel
            </Button>
            <Button loading={false} disabled={!canSaveRoles} onClick={() => {}}>
              Save roles
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
