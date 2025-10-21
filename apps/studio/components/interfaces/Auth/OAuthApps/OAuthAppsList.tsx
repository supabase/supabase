import type { OAuthClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import { Edit, MoreVertical, Plus, Search, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOAuthServerAppsQuery } from 'data/oauth-server-apps/oauth-server-apps-query'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { CreateOAuthAppModal } from './CreateOAuthAppModal'
import { DeleteOAuthAppModal } from './DeleteOAuthAppModal'
import { RegenerateClientSecretDialog } from './RegenerateClientSecretDialog'

export const OAUTH_APP_SCOPES_OPTIONS = [
  { name: 'email', value: 'email' },
  { name: 'profile', value: 'profile' },
  { name: 'openid', value: 'openid' },
]

export const OAUTH_APP_TYPE_OPTIONS = [
  { name: 'Manual', value: 'manual' },
  { name: 'Dynamic', value: 'dynamic' },
]

const OAuthAppsList = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, isLoading: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const isOAuthServerEnabled = !!authConfig?.OAUTH_SERVER_ENABLED

  // State for OAuth apps
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<OAuthClient>()
  const [filteredAppTypes, setFilteredAppTypes] = useState<string[]>([])
  const [filteredAppScopes, setFilteredAppScopes] = useState<string[]>([])
  const error = { message: 'Failed to retrieve oauth apps' }

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { data, isLoading, isError } = useOAuthServerAppsQuery(
    {
      projectRef,
      supabaseClient: supabaseClientData?.supabaseClient,
      temporaryApiKey: supabaseClientData?.temporaryApiKey,
    },
    { enabled: isOAuthServerEnabled }
  )

  const oAuthApps = data?.clients || []

  const handleDeleteClick = (app: OAuthClient) => {
    setSelectedApp(app)
    setShowDeleteModal(true)
  }

  const [filterString, setFilterString] = useState<string>('')

  if (isAuthConfigLoading || (isOAuthServerEnabled && isLoading)) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve OAuth Server apps" />
  }

  return (
    <>
      <div className="space-y-4">
        {!isOAuthServerEnabled && (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div className="flex flex-col gap-2-4">
                  <h3 className="">OAuth Server is disabled</h3>
                  <p className="text-foreground-light text-sm">
                    Enable the OAuth Server to make your project act as an identity provider for
                    third-party applications.
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/project/${projectRef}/auth/oauth-server`}>
                    Go to OAuth Server Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Input
              placeholder="Search oAuth apps"
              size="tiny"
              icon={<Search size="14" />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <FilterPopover
              name="Type"
              options={OAUTH_APP_TYPE_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredAppTypes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredAppTypes}
            />
            <FilterPopover
              name="Scope"
              options={OAUTH_APP_SCOPES_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredAppScopes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredAppScopes}
            />
          </div>
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              disabled={!isOAuthServerEnabled}
              icon={<Plus />}
              onClick={() => setShowCreatePanel(true)}
              className="flex-grow"
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !isOAuthServerEnabled
                    ? 'OAuth server must be enabled in settings'
                    : undefined,
                },
              }}
            >
              New OAuth App
            </ButtonTooltip>
          </div>
        </div>

        <div className="w-full overflow-hidden overflow-x-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name" className="w-1/4">
                    Name
                  </TableHead>
                  <TableHead key="table">Client ID</TableHead>
                  <TableHead key="function">Type</TableHead>
                  <TableHead key="function">Scope</TableHead>
                  <TableHead key="function">Created</TableHead>
                  <TableHead key="buttons" className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oAuthApps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <p className="text-foreground-lighter">No OAuth apps found</p>
                    </TableCell>
                  </TableRow>
                )}
                {oAuthApps.length > 0 &&
                  oAuthApps.map((app) => (
                    <TableRow key={app.client_id} className="w-full">
                      <TableCell className="max-w-64 truncate">{app.client_name}</TableCell>
                      <TableCell className="w-40">{app.client_id}</TableCell>
                      <TableCell className="w-40">
                        <Badge>{app.registration_type}</Badge>
                      </TableCell>
                      <TableCell className="min-w-40">
                        {app.scope ? (
                          <Badge key={`${app.client_id}-${app.scope}-badge`}>{app.scope}</Badge>
                        ) : (
                          <span className="text-xs text-foreground-light">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light w-1/6">
                        {dayjs(app.created_at).format('D MMM, YYYY')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-32">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => {
                                  setSelectedApp(app)
                                  setShowRegenerateDialog(true)
                                }}
                              >
                                <Edit size={14} />
                                <p>Regenerate client secret</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => handleDeleteClick(app)}
                              >
                                <Trash size={14} />
                                <p>Delete</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <CreateOAuthAppModal visible={showCreatePanel} onClose={() => setShowCreatePanel(false)} />

      <RegenerateClientSecretDialog
        visible={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        clientId={selectedApp?.client_id ?? ''}
        clientSecret={selectedApp?.client_secret ?? ''}
      />
      <DeleteOAuthAppModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedApp={selectedApp}
      />
    </>
  )
}

export default OAuthAppsList
