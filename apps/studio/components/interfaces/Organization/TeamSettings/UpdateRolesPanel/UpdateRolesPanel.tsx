import { useParams } from 'common'
import { OrganizationMember } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import { PanelLeftClose, PanelRightClose } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import { MultiSelectV2 } from 'ui-patterns/MultiSelect/MultiSelectV2'
import { RolesAccessMatrix } from './RolesAccessMatrix'

interface UpdateRolesPanelProps {
  visible: boolean
  member: OrganizationMember
  onClose: () => void
}

// [Joshen] This is just scaffolding the UI logic, will need to change quite a bit to fit the API structure

export const UpdateRolesPanel = ({ visible, member, onClose }: UpdateRolesPanelProps) => {
  const { slug } = useParams()
  const organization = useSelectedOrganization()
  const { data } = useOrganizationRolesQuery({ slug })
  const { data: projects } = useProjectsQuery()

  const [showRolesAccessMatrix, setShowRolesAccessMatrix] = useState(false)
  const [roleConfiguration, setRoleConfiguration] = useState<
    { id: number; name: string; projects: string[] }[]
  >([])

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

  const canSaveRoles = roleConfiguration.length > 0

  useEffect(() => {
    // [Joshen] This is an assumption for the structure
    if (visible) {
      setRoleConfiguration(
        appliedRoles.map((role) => {
          return { ...role, projects: [] }
        })
      )
    } else {
      setShowRolesAccessMatrix(false)
    }
  }, [visible])

  return (
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
          <SheetHeader className={cn('py-3 flex flex-row justify-between items-center border-b')}>
            <p>Manage access for team member</p>
            <Tooltip_Shadcn_ delayDuration={200}>
              <TooltipTrigger_Shadcn_ asChild>
                <button
                  aria-expanded={showRolesAccessMatrix}
                  aria-controls="ai-chat-assistant"
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
                {showRolesAccessMatrix ? 'Hide' : 'Show'} roles access rules
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          </SheetHeader>

          <div className="h-full flex flex-col gap-y-4 px-5 py-5">
            <p className="text-sm">
              Assign roles to each project under {organization?.name} for {member.username}
            </p>
            {roleConfiguration.length === 0 && (
              <Alert_Shadcn_>
                <AlertTitle_Shadcn_>
                  Team members need to be assigned at least one role
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  You may not remove all roles from a team member
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
            {roleConfiguration.map((role) => {
              return (
                <div
                  key={role.name}
                  className="flex flex-col border border-control rounded gap-y-2 px-3 py-3 bg-surface-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{role.name}</p>
                    <Button type="default" onClick={() => onRemoveRole(role)}>
                      Remove role
                    </Button>
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
                    value={[]}
                    placeholder="All projects"
                    searchPlaceholder="Search for a project"
                    onChange={(roles) => {}}
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
        {showRolesAccessMatrix && <RolesAccessMatrix visible={showRolesAccessMatrix} />}
      </SheetContent>
    </Sheet>
  )
}
