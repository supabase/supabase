import { isEqual } from 'lodash'
import { HelpCircle, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import {
  TablePrivilegesGrant,
  useTablePrivilegesGrantMutation,
} from 'data/privileges/table-privileges-grant-mutation'
import { useTablePrivilegesQuery } from 'data/privileges/table-privileges-query'
import {
  TablePrivilegesRevoke,
  useTablePrivilegesRevokeMutation,
} from 'data/privileges/table-privileges-revoke-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import { getQueueFunctionsMapping } from './Queue.utils'
import { Admonition } from 'ui-patterns'
import Link from 'next/link'

const ACTIONS = ['select', 'insert', 'update', 'delete']
const ROLES = ['anon', 'authenticated', 'postgres', 'service_role']
type Privileges = { select?: boolean; insert?: boolean; update?: boolean; delete?: boolean }

interface QueueSettingsProps {}

export const QueueSettings = ({}: QueueSettingsProps) => {
  const { childId: name } = useParams()
  const project = useSelectedProject()

  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [privileges, setPrivileges] = useState<{ [key: string]: Privileges }>({})

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, error, isLoading, isSuccess, isError } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? [])
    .filter((x) => ROLES.includes(x.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  const { data: queueTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'pgmq',
  })
  const queueTable = queueTables?.find((x) => x.name === `q_${name}`)
  const archiveTable = queueTables?.find((x) => x.name === `a_${name}`)

  const { data: allTablePrivileges, isSuccess: isSuccessPrivileges } = useTablePrivilegesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const queuePrivileges = allTablePrivileges?.find(
    (x) => x.schema === 'pgmq' && x.name === `q_${name}`
  )

  const { mutateAsync: grantPrivilege } = useTablePrivilegesGrantMutation()
  const { mutateAsync: revokePrivilege } = useTablePrivilegesRevokeMutation()

  const onTogglePrivilege = (role: string, action: string, value: boolean) => {
    const updatedPrivileges = { ...privileges, [role]: { ...privileges[role], [action]: value } }
    setPrivileges(updatedPrivileges)
  }

  const onSaveConfiguration = async () => {
    if (!project) return console.error('Project is required')
    if (!queueTable) return console.error('Unable to find queue table')
    if (!archiveTable) return console.error('Unable to find archive table')

    setIsSaving(true)
    const revoke: { role: string; action: string }[] = []
    const grant: { role: string; action: string }[] = []

    Object.entries(privileges).forEach(([role, p]) => {
      const originalRolePrivileges = queuePrivileges?.privileges.filter((x) => x.grantee === role)
      Object.entries(p).forEach(([action, value]) => {
        const originalValue = !!originalRolePrivileges?.find(
          (x) => x.privilege_type.toLowerCase() === action
        )
        if (value !== originalValue) {
          if (value) grant.push({ role, action })
          else revoke.push({ role, action })
        }
      })
    })

    const rolesBeingGrantedPerms = [...new Set(grant.map((x) => x.role))]
    const rolesBeingRevokedPerms = [...new Set(revoke.map((x) => x.role))]

    const rolesNoLongerHavingPerms = rolesBeingRevokedPerms.filter((x) => {
      const existingPrivileges = queuePrivileges?.privileges
        .filter((y) => x === y.grantee)
        .map((y) => y.privilege_type)
      const privilegesGettingRevoked = revoke
        .filter((y) => y.role === x)
        .map((y) => y.action.toUpperCase())
      const privilegesGettingGranted = grant.filter((y) => y.role === x)
      return (
        privilegesGettingGranted.length === 0 &&
        isEqual(existingPrivileges, privilegesGettingRevoked)
      )
    })

    try {
      await Promise.all([
        ...(revoke.length > 0
          ? [
              revokePrivilege({
                projectRef: project.ref,
                connectionString: project.connectionString,
                revokes: revoke.map((x) => ({
                  grantee: x.role,
                  privilegeType: x.action.toUpperCase(),
                  relationId: queueTable.id,
                })) as TablePrivilegesRevoke[],
              }),
            ]
          : []),
        // Revoke select + insert on archive table only if role no longer has ANY perms on the queue table
        ...(rolesNoLongerHavingPerms.length > 0
          ? [
              revokePrivilege({
                projectRef: project.ref,
                connectionString: project.connectionString,
                revokes: [
                  ...rolesNoLongerHavingPerms.map((x) => ({
                    grantee: x,
                    privilegeType: 'INSERT' as const,
                    relationId: archiveTable.id,
                  })),
                  ...rolesNoLongerHavingPerms.map((x) => ({
                    grantee: x,
                    privilegeType: 'SELECT' as const,
                    relationId: archiveTable.id,
                  })),
                ],
              }),
            ]
          : []),
        ...(grant.length > 0
          ? [
              grantPrivilege({
                projectRef: project.ref,
                connectionString: project.connectionString,
                grants: grant.map((x) => ({
                  grantee: x.role,
                  privilegeType: x.action.toUpperCase(),
                  relationId: queueTable.id,
                })) as TablePrivilegesGrant[],
              }),
              // Just grant select + insert on archive table as long as we're granting any perms to the queue table for the role
              grantPrivilege({
                projectRef: project.ref,
                connectionString: project.connectionString,
                grants: [
                  ...rolesBeingGrantedPerms.map((x) => ({
                    grantee: x,
                    privilegeType: 'INSERT' as const,
                    relationId: archiveTable.id,
                  })),
                  ...rolesBeingGrantedPerms.map((x) => ({
                    grantee: x,
                    privilegeType: 'SELECT' as const,
                    relationId: archiveTable.id,
                  })),
                ],
              }),
            ]
          : []),
      ])
      toast.success('Successfully updated permissions')
      setOpen(false)
    } catch (error: any) {
      toast.error(`Failed to update permissions: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (open && isSuccessPrivileges && queuePrivileges) {
      const initialState = queuePrivileges.privileges.reduce((a, b) => {
        return {
          ...a,
          [b.grantee]: { ...(a as any)[b.grantee], [b.privilege_type.toLowerCase()]: true },
        }
      }, {})
      setPrivileges(initialState)
    }
  }, [open, isSuccessPrivileges])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <ButtonTooltip
          type="text"
          className="px-1.5"
          icon={<Settings />}
          title="Settings"
          tooltip={{ content: { side: 'bottom', text: 'Queue settings' } }}
        />
      </SheetTrigger>
      <SheetContent size="lg" className="overflow-auto flex flex-col gap-y-0">
        <SheetHeader>
          <SheetTitle>Manage queue permissions on {name}</SheetTitle>
          <SheetDescription>
            Configure permissions for the following roles to grant access to the relevant actions on
            the queue.{' '}
            {isExposed && (
              <>
                These will also determine access to each function available from the{' '}
                <code className="text-xs">pgmq_public</code> schema.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <SheetSection className="p-0 flex-grow">
          {!isExposed ? (
            <Admonition
              type="default"
              className="rounded-none border-x-0 border-t-0"
              title="Queue permissions are only relevant if exposure through PostgREST has been enabled"
              description={
                <>
                  You may opt to manage your queues via any Supabase client libraries or PostgREST
                  endpoints by enabling this in the{' '}
                  <Link
                    href={`/project/${project?.ref}/integrations/queues/settings`}
                    className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground"
                  >
                    queues settings
                  </Link>
                </>
              }
            />
          ) : (
            <Admonition
              type="default"
              className="rounded-none border-x-0 border-t-0"
              title="Only relevant roles for managing queues via client libraries or PostgREST are shown here"
            />
          )}
          <Table>
            <TableHeader className="[&_th]:h-8">
              <TableRow className="py-2">
                <TableHead>Role</TableHead>
                {ACTIONS.map((x) => {
                  const relatedFunctions = getQueueFunctionsMapping(x)
                  return (
                    <TableHead key={x}>
                      <Tooltip_Shadcn_>
                        <TooltipTrigger_Shadcn_ className="mx-auto flex items-center gap-x-1 capitalize text-foreground-light font-normal">
                          {x}
                          {isExposed && <HelpCircle size={14} strokeWidth={1.5} />}
                        </TooltipTrigger_Shadcn_>
                        {isExposed && (
                          <TooltipContent_Shadcn_
                            side="bottom"
                            className="w-64 flex flex-col gap-y-1"
                          >
                            <p>
                              Required for{' '}
                              {relatedFunctions.length === 6
                                ? 'all'
                                : `the following ${relatedFunctions.length}`}{' '}
                              functions:
                            </p>
                            <div className="max-w-full flex flex-wrap gap-x-0.5 gap-y-1">
                              {relatedFunctions.map((y) => (
                                <code key={`${x}_${y}`}>{y}</code>
                              ))}
                            </div>
                          </TooltipContent_Shadcn_>
                        )}
                      </Tooltip_Shadcn_>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody className="[&_td]:py-2">
              {isLoading && (
                <>
                  <TableRow>
                    <TableCell colSpan={5}>
                      <ShimmeringLoader />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4}>
                      <ShimmeringLoader />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3}>
                      <ShimmeringLoader />
                    </TableCell>
                  </TableRow>
                </>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <AlertError subject="Failed to retrieve roles" error={error} />
                  </TableCell>
                </TableRow>
              )}
              {isSuccess &&
                (roles ?? []).map((role) => {
                  return (
                    <TableRow key={role.id}>
                      <TableCell>{role.name}</TableCell>
                      {ACTIONS.map((x) => (
                        <TableCell key={x} className="text-center">
                          <Switch
                            checked={
                              (privileges[role.name] as Privileges)?.[x as keyof Privileges] ??
                              false
                            }
                            onCheckedChange={(value) => onTogglePrivilege(role.name, x, value)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </SheetSection>
        <SheetFooter>
          <Button type="default" disabled={isSaving} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="primary" loading={isSaving} onClick={onSaveConfiguration}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
