import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Edit, MoreVertical, Plus, Search, Trash } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema, useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  Input,
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from 'ui'
import { DATE_FORMAT } from 'lib/constants'
import dayjs from 'dayjs'

interface OAuthAppsListProps {
  createTrigger: () => void
  editTrigger: (trigger: PostgresTrigger) => void
  deleteTrigger: (trigger: PostgresTrigger) => void
}

const OAUTH_CLIENT_TYPE_OPTIONS = [
  { name: 'Manual', value: 'manual' },
  { name: 'Dynamic', value: 'dynamic' },
]

const OAUTH_CLIENT_SCOPES_OPTIONS = [
  { name: 'email', value: 'email' },
  { name: 'profile', value: 'profile' },
  { name: 'openid', value: 'openid' },
]

interface OAuthApp {
  id: string
  name: string
  clientId: string
  scopes: string[]
  type: string
  createdAt: string
}

const defaultDummyClients = [
  {
    id: '1',
    name: 'Client 1',
    clientId: '1',
    scopes: [OAUTH_CLIENT_SCOPES_OPTIONS[0].name, OAUTH_CLIENT_SCOPES_OPTIONS[1].name],
    type: 'manual',
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    name: 'Client 2',
    clientId: '2',
    scopes: [OAUTH_CLIENT_SCOPES_OPTIONS[2].name],
    type: 'dynamic',
    createdAt: '2026-01-01',
  },
]

const OAuthAppsList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: OAuthAppsListProps) => {
  // const { data: project } = useSelectedProjectQuery()
  // const { data: oAuthClients, isLoading, isError, isSuccess } = useOAuthAppsQuery({
  //   projectRef: project?.ref,
  //   connectionString: project?.connectionString,
  // })
  // Mock state
  const [selectedClient, setSelectedClient] = useState<OAuthApp>()
  const [filteredClientTypes, setFilteredClientTypes] = useState<string[]>([])
  const [filteredClientScopes, setFilteredClientScopes] = useState<string[]>([])
  const [oAuthClients, _setOAuthClients] = useState<OAuthApp[]>(defaultDummyClients)
  const [isLoading, _setIsLoading] = useState(false)
  const [isError, _setIsError] = useState(false)
  const error = { message: 'Failed to retrieve oauth clients' }

  const [isOAuthServerEnabled, _setIsOAuthServerEnabled] = useState(true)
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

  const { data: protectedSchemas } = useProtectedSchemas()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const { can: canCreateTriggers } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'triggers'
  )

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve database triggers" />
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Input
              placeholder="Search oAuth clients"
              size="tiny"
              icon={<Search size="14" />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <FilterPopover
              name="Registration type"
              options={OAUTH_CLIENT_TYPE_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredClientTypes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredClientTypes}
            />
            <FilterPopover
              name="Scope"
              options={OAUTH_CLIENT_SCOPES_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredClientScopes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredClientScopes}
            />
          </div>
          {!isSchemaLocked && (
            <div className="flex items-center gap-x-2">
              <ButtonTooltip
                disabled={!isOAuthServerEnabled || !canCreateTriggers}
                icon={<Plus />}
                onClick={() => createTrigger()}
                className="flex-grow"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !isOAuthServerEnabled
                      ? 'Create a table first before creating triggers'
                      : !canCreateTriggers
                        ? 'You need additional permissions to create triggers'
                        : undefined,
                  },
                }}
              >
                New OAuth Client
              </ButtonTooltip>
            </div>
          )}
        </div>

        {/* {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="triggers" />} */}

        <div className="w-full overflow-hidden overflow-x-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name" className="w-1/4">
                    Client Name
                  </TableHead>
                  <TableHead key="table">Client ID</TableHead>
                  <TableHead key="function">Registration</TableHead>
                  <TableHead key="function">Scopes</TableHead>
                  <TableHead key="function">Created at</TableHead>
                  <TableHead key="buttons" className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {}
                {oAuthClients.length > 0 &&
                  oAuthClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="w-20">
                        <p className="w-20 truncate">{client.name}</p>
                      </TableCell>
                      <TableCell>{client.id}</TableCell>
                      <TableCell>
                        <Badge>{client.type}</Badge>
                      </TableCell>
                      <TableCell className="flex flex-wrap gap-2">
                        {client.scopes.map((scope) => (
                          <Badge key={`${client.id}-${scope}-badge`}>{scope}</Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light">
                        {dayjs(client.createdAt).format('DD MMM, YYYY')}
                      </TableCell>
                      <TableCell>
                        {!isSchemaLocked && (
                          <div className="flex justify-end items-center space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="default" className="px-1" icon={<MoreVertical />} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="bottom" align="end" className="w-32">
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setSelectedClient(client)}
                                >
                                  <Edit size={14} />
                                  <p>Update client</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setSelectedClient(client)}
                                >
                                  <Trash size={14} />
                                  <p>Delete client</p>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </>
  )
}

export default OAuthAppsList
