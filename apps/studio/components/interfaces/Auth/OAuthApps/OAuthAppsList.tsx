import { useState, useEffect } from 'react'
import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Edit, MoreVertical, Plus, Search, Trash } from 'lucide-react'
import dayjs from 'dayjs'

import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
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
import CreateOAuthAppModal from './CreateOAuthAppModal'
import UpdateOAuthAppSidePanel from './UpdateOAuthAppSidePanel'
import DeleteOAuthAppModal from './DeleteOAuthAppModal'

import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'

import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'

interface OAuthAppsListProps {
  createTrigger?: () => void
  editTrigger?: (trigger: PostgresTrigger) => void
  deleteTrigger?: (trigger: PostgresTrigger) => void
}

export const OAUTH_APP_SCOPES_OPTIONS = [
  { name: 'email', value: 'email' },
  { name: 'profile', value: 'profile' },
  { name: 'openid', value: 'openid' },
  { name: 'offline_access', value: 'offline_access' },
]

export const OAUTH_APP_TYPE_OPTIONS = [
  { name: 'Manual', value: 'manual' },
  { name: 'Dynamic', value: 'dynamic' },
]

const OAuthAppsList = ({
  createTrigger = noop,
  editTrigger = noop,
  deleteTrigger = noop,
}: OAuthAppsListProps) => {
  // State for OAuth apps
  const [oAuthApps, setOAuthApps] = useState<OAuthApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [showUpdatePanel, setShowUpdatePanel] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<OAuthApp>()
  const [filteredAppTypes, setFilteredAppTypes] = useState<string[]>([])
  const [filteredAppScopes, setFilteredAppScopes] = useState<string[]>([])
  const error = { message: 'Failed to retrieve oauth apps' }

  // Load OAuth apps from localStorage on component mount
  useEffect(() => {
    const loadOAuthApps = () => {
      try {
        const stored = localStorage.getItem('oauth_apps')
        if (stored) {
          const parsedApps = JSON.parse(stored)
          setOAuthApps(parsedApps)
        }
      } catch (error) {
        console.error('Error loading OAuth apps from localStorage:', error)
        setIsError(true)
      }

      setIsLoading(false)
    }

    loadOAuthApps()
  }, [])

  // Load OAuth server settings from localStorage
  useEffect(() => {
    const loadOAuthServerSettings = () => {
      try {
        const stored = localStorage.getItem('oauth_server_settings')
        if (stored) {
          const parsedSettings = JSON.parse(stored)
          setOAuthServerSettings(parsedSettings)
          setIsOAuthServerEnabled(parsedSettings.oauthServerEnabled)
        }
      } catch (error) {
        console.error('Error loading OAuth server settings from localStorage:', error)
      }
    }

    loadOAuthServerSettings()
  }, [])

  // Handle successful OAuth app creation
  const handleOAuthAppCreated = (newApp: OAuthApp) => {
    setOAuthApps((prev) => [...prev, newApp])
    setShowCreatePanel(false)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('oauth-apps-changed'))
  }

  // Handle successful OAuth app update
  const handleOAuthAppUpdated = (updatedApp: OAuthApp) => {
    setOAuthApps((prev) => prev.map((app) => (app.id === updatedApp.id ? updatedApp : app)))
    setShowUpdatePanel(false)
    setSelectedApp(undefined)
  }

  // Handle successful OAuth app deletion
  const handleOAuthAppDeleted = () => {
    if (selectedApp) {
      setOAuthApps((prev) => prev.filter((app) => app.id !== selectedApp.id))
      setShowDeleteModal(false)
      setShowUpdatePanel(false)
      setSelectedApp(undefined)
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('oauth-apps-changed'))
    }
  }

  // Handle edit button click
  const handleEditClick = (app: OAuthApp) => {
    setSelectedApp(app)
    setShowUpdatePanel(true)
  }

  // Handle delete button click
  const handleDeleteClick = (app: OAuthApp) => {
    setSelectedApp(app)
    setShowDeleteModal(true)
  }

  const [isOAuthServerEnabled, setIsOAuthServerEnabled] = useState(false)
  const [oauthServerSettings, setOAuthServerSettings] = useState({
    oauthServerEnabled: false,
    allowDynamicApps: false,
    allowPublicApps: false,
    availableScopes: ['openid', 'email', 'profile'],
  })
  const aiSnap = useAiAssistantStateSnapshot()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [filterString, setFilterString] = useState<string>('')

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
          {!isSchemaLocked && (
            <div className="flex items-center gap-x-2">
              <ButtonTooltip
                disabled={!isOAuthServerEnabled || !canCreateTriggers}
                icon={<Plus />}
                onClick={() => setShowCreatePanel(true)}
                className="flex-grow"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !isOAuthServerEnabled
                      ? 'OAuth server must be enabled in settings'
                      : !canCreateTriggers
                        ? 'You need additional permissions to create OAuth apps'
                        : undefined,
                  },
                }}
              >
                New OAuth App
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
                    Name
                  </TableHead>
                  <TableHead key="table">Client ID</TableHead>
                  <TableHead key="function">Type</TableHead>
                  <TableHead key="function">Scopes</TableHead>
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
                    <TableRow key={app.id} className="w-full">
                      <TableCell className="max-w-64 truncate">
                        <button onClick={() => handleEditClick(app)}>{app.name}</button>
                      </TableCell>
                      <TableCell className="w-40">{app.client_id}</TableCell>
                      <TableCell className="w-40">
                        <Badge>{app.type}</Badge>
                      </TableCell>
                      <TableCell className="flex flex-wrap gap-2 flex-1 min-w-40">
                        {app.scopes.map((scope: string) => (
                          <Badge key={`${app.id}-${scope}-badge`}>{scope}</Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light w-1/6">
                        {dayjs(app.created_at).format('D MMM, YYYY')}
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
                                  onClick={() => handleEditClick(app)}
                                >
                                  <Edit size={14} />
                                  <p>Edit</p>
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
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <CreateOAuthAppModal
        visible={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onSuccess={handleOAuthAppCreated}
      />
      <UpdateOAuthAppSidePanel
        visible={showUpdatePanel}
        onClose={() => setShowUpdatePanel(false)}
        onSuccess={handleOAuthAppUpdated}
        selectedApp={selectedApp}
        onDeleteClick={handleDeleteClick}
      />
      <DeleteOAuthAppModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleOAuthAppDeleted}
        selectedApp={selectedApp}
      />
    </>
  )
}

export default OAuthAppsList
