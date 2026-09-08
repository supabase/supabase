import { Table2 } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

import { useEditorType } from '../editors/EditorsLayout.hooks'
import { ActionCard } from './ActionCard'
import { RecentItems } from './RecentItems'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import {
  useImpersonatedAAL,
  useImpersonatedExternalAuth,
  useImpersonatedUser,
  useIsImpersonatingAnon,
  useRoleImpersonationStateSnapshot,
} from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

export function NewTab() {
  const editor = useEditorType()
  const { selectedSchema } = useQuerySchemaState()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const snap = useTableEditorStateSnapshot()
  const roleState = useRoleImpersonationStateSnapshot()
  const impersonatingAnon = useIsImpersonatingAnon()
  const impersonatedUser = useImpersonatedUser()
  const impersonatedExternalUser = useImpersonatedExternalAuth()
  const impersonatedAAL = useImpersonatedAAL()

  const tableEditorActions = isSchemaLocked
    ? []
    : [
        {
          icon: <Table2 className="h-4 w-4 text-foreground" strokeWidth={1.5} />,
          title: 'Create a table',
          description: 'Design and create a new database table',
          bgColor: 'bg-blue-500',
          isBeta: false,
          onClick: () => snap.onAddTable(),
        },
      ]

  const actions = editor === 'table' ? tableEditorActions : []

  return (
    <div className="bg-surface-100 h-full overflow-y-auto py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-10 px-10">
        {(!!impersonatedUser || !!impersonatedExternalUser || impersonatingAnon) && (
          <Card>
            <CardHeader className="py-2 px-3 flex-row items-center justify-between w-full space-y-0">
              <CardTitle className="text-foreground-light">Currently impersonating as</CardTitle>
              <Button
                variant="default"
                className="font-sans"
                onClick={() => roleState.setRole(undefined)}
              >
                Stop
              </Button>
            </CardHeader>
            <CardContent className="py-2 px-3 text-sm flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                {impersonatingAnon ? (
                  <p>Anonymous</p>
                ) : (
                  <p>{impersonatedUser?.email ?? impersonatedExternalUser}</p>
                )}
                {impersonatedAAL && <Badge>{impersonatedAAL.toUpperCase()}</Badge>}
              </div>
              {impersonatingAnon && <p className="text-foreground-lighter">Not logged-in</p>}
              {!!impersonatedUser && (
                <p>
                  ID: <code className="text-code-inline">{impersonatedUser.id}</code>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          {actions.map((item, i) => (
            <ActionCard key={`action-card-${i}`} {...item} />
          ))}
        </div>

        <RecentItems />
      </div>
    </div>
  )
}
