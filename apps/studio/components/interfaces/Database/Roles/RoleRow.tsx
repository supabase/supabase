import { useDatabaseRoleUpdateMutation } from 'data/database-roles/database-role-update-mutation'
import { PgRole } from 'data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ChevronUp, HelpCircle, MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Collapsible,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { ROLE_PERMISSIONS } from './Roles.constants'

interface RoleRowProps {
  role: PgRole
  disabled?: boolean
  onSelectDelete: (role: string) => void
}

export const RoleRow = ({ role, disabled = false, onSelectDelete }: RoleRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isExpanded, setIsExpanded] = useState(false)

  const { mutate: updateDatabaseRole, isPending: isUpdating } = useDatabaseRoleUpdateMutation()

  const { isSuperuser, canLogin, canCreateRole, canCreateDb, isReplicationRole, canBypassRls } =
    role

  const onSaveChanges = async (values: Partial<PgRole>, { resetForm }: any) => {
    if (!project) return console.error('Project is required')

    const changed = Object.fromEntries(
      Object.entries(values).filter(([k, v]) => v !== (role as any)[k])
    )

    updateDatabaseRole(
      {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id: role.id,
        payload: changed,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully updated role "${role.name}"`)
          resetForm({ values: { ...values }, initialValues: { ...values } })
        },
      }
    )
  }

  return (
    <Form
      name="role-update-form"
      initialValues={{
        isSuperuser,
        canLogin,
        canCreateRole,
        canCreateDb,
        isReplicationRole,
        canBypassRls,
      }}
      onSubmit={onSaveChanges}
      className={cn(
        'bg-surface-100',
        'hover:bg-overlay-hover',
        'data-open:bg-selection',
        'border-default hover:border-strong',
        'data-open:border-strong',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'border border-t-0 first:border-t first:!mt-0 hover:border-t hover:-mt-[1px] shadow transition hover:z-50',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br'
      )}
    >
      {({ values, initialValues, handleReset }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        return (
          <Collapsible open={isExpanded}>
            <Collapsible.Trigger asChild>
              <button
                id="collapsible-trigger"
                type="button"
                className="group flex w-full items-center justify-between rounded py-3 px-card text-foreground"
                onClick={(event: any) => {
                  if (event.target.id === 'collapsible-trigger') setIsExpanded(!isExpanded)
                }}
              >
                <div className="flex items-start space-x-3">
                  <ChevronUp
                    id="collapsible-trigger"
                    className="text-border-stronger transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                    strokeWidth={2}
                    width={14}
                  />
                  <div className="space-x-2 flex items-center">
                    <p className="text-left text-sm" id="collapsible-trigger">
                      {role.name}
                    </p>
                    <p className="text-left text-sm text-foreground-light" id="collapsible-trigger">
                      (ID: {role.id})
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {role.activeConnections > 0 && (
                    <div className="relative h-2 w-2">
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand opacity-75"></span>
                      </span>
                    </div>
                  )}
                  <p
                    id="collapsible-trigger"
                    className={`text-sm ${
                      role.activeConnections > 0 ? 'text-foreground' : 'text-foreground-light'
                    }`}
                  >
                    {role.activeConnections} connections
                  </p>
                  {!disabled && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" className="px-1" icon={<MoreVertical />} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" className="w-[120px]">
                        <DropdownMenuItem
                          className="space-x-2"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSelectDelete(role.id.toString())
                          }}
                        >
                          <Trash className="text-red-800" size="14" strokeWidth={2} />
                          <p>Delete</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="group border-t border-default bg-surface-100 py-6 px-5 md:px-20 text-foreground">
                <div className="py-4 space-y-[9px]">
                  {(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map(
                    (permission) => (
                      <Toggle
                        size="small"
                        key={permission}
                        id={permission}
                        name={permission}
                        label={ROLE_PERMISSIONS[permission].description}
                        disabled={disabled || ROLE_PERMISSIONS[permission].disabled}
                        className={[
                          'roles-toggle',
                          disabled || ROLE_PERMISSIONS[permission].disabled
                            ? '[&>div>button]:opacity-30 [&>div>label]:text-foreground-lighter'
                            : '',
                        ].join(' ')}
                        afterLabel={
                          !disabled &&
                          ROLE_PERMISSIONS[permission].disabled && (
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle
                                  size="14"
                                  strokeWidth={2}
                                  className="ml-2 relative top-[3px]"
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                This privilege cannot be updated via the dashboard
                              </TooltipContent>
                            </Tooltip>
                          )
                        }
                      />
                    )
                  )}
                </div>
                {!disabled && (
                  <div className="py-4 flex items-center space-x-2 justify-end">
                    <Button
                      type="default"
                      disabled={!hasChanges || isUpdating}
                      onClick={() => handleReset()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!hasChanges || isUpdating}
                      loading={isUpdating}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </Collapsible.Content>
          </Collapsible>
        )
      }}
    </Form>
  )
}
