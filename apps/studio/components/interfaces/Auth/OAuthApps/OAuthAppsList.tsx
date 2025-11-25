import type { OAuthClient } from '@supabase/supabase-js'
import { MoreVertical, Edit, Plus, RotateCw, Search, Trash, X } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOAuthServerAppDeleteMutation } from 'data/oauth-server-apps/oauth-server-app-delete-mutation'
import { useOAuthServerAppRegenerateSecretMutation } from 'data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
import { useOAuthServerAppsQuery } from 'data/oauth-server-apps/oauth-server-apps-query'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import { useQueryStateWithSelect, handleErrorOnDelete } from 'hooks/misc/useQueryStateWithSelect'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { CreateOrUpdateOAuthAppSheet } from './CreateOrUpdateOAuthAppSheet'
import { DeleteOAuthAppModal } from './DeleteOAuthAppModal'
import { NewOAuthAppBanner } from './NewOAuthAppBanner'
import {
  filterOAuthApps,
  OAUTH_APP_CLIENT_TYPE_OPTIONS,
  OAUTH_APP_REGISTRATION_TYPE_OPTIONS,
} from './oauthApps.utils'

export const OAuthAppsList = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, isLoading: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const isOAuthServerEnabled = !!authConfig?.OAUTH_SERVER_ENABLED
  const [newOAuthApp, setNewOAuthApp] = useState<OAuthClient | undefined>(undefined)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [selectedApp, setSelectedApp] = useState<OAuthClient>()
  const [filteredRegistrationTypes, setFilteredRegistrationTypes] = useState<string[]>([])
  const [filteredClientTypes, setFilteredClientTypes] = useState<string[]>([])
  const deletingOAuthAppIdRef = useRef<string | null>(null)

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })
  const { data, isLoading, isError, error } = useOAuthServerAppsQuery(
    {
      projectRef,
      supabaseClient: supabaseClientData?.supabaseClient,
    },
    { enabled: isOAuthServerEnabled }
  )

  const { mutateAsync: regenerateSecret, isPending: isRegenerating } =
    useOAuthServerAppRegenerateSecretMutation({
      onSuccess: (data) => {
        if (data) {
          setNewOAuthApp(data)
        }
      },
    })

  const oAuthApps = data?.clients || []

  const [showCreateSheet, setShowCreateSheet] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { setValue: setSelectedAppToEdit, value: appToEdit } = useQueryStateWithSelect({
    urlKey: 'edit',
    select: (client_id: string) =>
      client_id ? oAuthApps?.find((app) => app.client_id === client_id) : undefined,
    enabled: !!oAuthApps?.length,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingOAuthAppIdRef, selectedId, `OAuth App not found`),
  })

  const { setValue: setSelectedAppToDelete, value: appToDelete } = useQueryStateWithSelect({
    urlKey: 'delete',
    select: (client_id: string) =>
      client_id ? oAuthApps?.find((app) => app.client_id === client_id) : undefined,
    enabled: !!oAuthApps?.length,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingOAuthAppIdRef, selectedId, `OAuth App not found`),
  })

  const { mutate: deleteOAuthApp, isLoading: isDeletingApp } = useOAuthServerAppDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted OAuth app`)
      setSelectedAppToDelete(null)
    },
    onError: () => {
      deletingOAuthAppIdRef.current = null
    },
  })

  const handleEditClick = (app: OAuthClient) => setSelectedAppToEdit(app.client_id)
  const handleDeleteClick = (app: OAuthClient) => setSelectedAppToDelete(app.client_id)

  const [filterString, setFilterString] = useState<string>('')

  const filteredOAuthApps = filterOAuthApps({
    apps: oAuthApps,
    searchString: filterString,
    registrationTypes: filteredRegistrationTypes,
    clientTypes: filteredClientTypes,
  })

  const hasActiveFilters =
    filterString.length > 0 ||
    filteredRegistrationTypes.length > 0 ||
    filteredClientTypes.length > 0

  const handleResetFilters = () => {
    setFilterString('')
    setFilteredRegistrationTypes([])
    setFilteredClientTypes([])
  }

  if (isAuthConfigLoading || (isOAuthServerEnabled && isLoading)) {
    return <GenericSkeletonLoader />
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve OAuth Server apps" />
  }

  return (
    <>
      <div className="space-y-4">
        {newOAuthApp?.client_secret && (
          <NewOAuthAppBanner oauthApp={newOAuthApp} onClose={() => setNewOAuthApp(undefined)} />
        )}
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
              name="Registration Type"
              options={OAUTH_APP_REGISTRATION_TYPE_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredRegistrationTypes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredRegistrationTypes}
            />
            <FilterPopover
              name="Client Type"
              options={OAUTH_APP_CLIENT_TYPE_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredClientTypes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredClientTypes}
            />
            {hasActiveFilters && (
              <Button
                type="default"
                size="tiny"
                className="px-1"
                icon={<X />}
                onClick={handleResetFilters}
              />
            )}
          </div>
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              disabled={!isOAuthServerEnabled}
              icon={<Plus />}
              onClick={() => setShowCreateSheet(true)}
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
          <Card className="@container">
            <Table containerProps={{ stickyLastColumn: true }}>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Client Type</TableHead>
                  <TableHead>Registration Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-8 px-0">
                    <div className="!bg-200 px-4 w-full h-full flex items-center border-l @[944px]:border-l-0" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOAuthApps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <p className="text-foreground-lighter">No OAuth apps found</p>
                    </TableCell>
                  </TableRow>
                )}
                {filteredOAuthApps.length > 0 &&
                  filteredOAuthApps.map((app) => (
                    <TableRow key={app.client_id} className="w-full">
                      <TableCell className="w-48 max-w-48 flex" title={app.client_name}>
                        <Button
                          type="text"
                          className="text-link-table-cell text-sm p-0 hover:bg-transparent title [&>span]:!w-full"
                          onClick={() => handleEditClick(app)}
                          title={app.client_name}
                        >
                          {app.client_name}
                        </Button>
                      </TableCell>
                      <TableCell title={app.client_id}>
                        <Badge className="font-mono">{app.client_id}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light max-w-28 capitalize">
                        {app.client_type}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light max-w-28 capitalize">
                        {app.registration_type}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light min-w-28 max-w-40 w-1/6">
                        <TimestampInfo utcTimestamp={app.created_at} labelFormat="D MMM, YYYY" />
                      </TableCell>
                      <TableCell className="max-w-20 bg-surface-100 @[944px]:hover:bg-surface-200 px-6">
                        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center border-l @[944px]:border-l-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-48">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => {
                                  handleEditClick(app)
                                }}
                              >
                                <Edit size={12} />
                                <p>Update</p>
                              </DropdownMenuItem>
                              {app.client_type === 'confidential' && (
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => {
                                    setSelectedApp(app)
                                    setShowRegenerateDialog(true)
                                  }}
                                >
                                  <RotateCw size={12} />
                                  <p>Regenerate client secret</p>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => handleDeleteClick(app)}
                              >
                                <Trash size={12} />
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

      <CreateOrUpdateOAuthAppSheet
        visible={showCreateSheet || !!appToEdit}
        appToEdit={appToEdit}
        onSuccess={(app) => {
          const isCreating = !appToEdit
          setShowCreateSheet(false)
          setSelectedAppToEdit(null)
          setSelectedApp(undefined)
          // Only show banner for new apps or regenerated secrets, not for simple edits
          if (isCreating || app.client_secret) {
            setNewOAuthApp(app)
          }
        }}
        onCancel={() => {
          setShowCreateSheet(false)
          setSelectedAppToEdit(null)
          setSelectedApp(undefined)
        }}
      />

      <DeleteOAuthAppModal
        visible={!!appToDelete}
        selectedApp={appToDelete}
        setVisible={setSelectedAppToDelete}
        onDelete={(params: Parameters<typeof deleteOAuthApp>[0]) => {
          deletingOAuthAppIdRef.current = params.clientId ?? null
          deleteOAuthApp(params)
        }}
        isLoading={isDeletingApp}
      />

      <ConfirmationModal
        variant="warning"
        visible={showRegenerateDialog}
        loading={isRegenerating}
        title="Confirm regenerating client secret"
        confirmLabel="Confirm"
        onCancel={() => setShowRegenerateDialog(false)}
        onConfirm={() => {
          if (selectedApp?.client_id) {
            regenerateSecret({
              projectRef,
              supabaseClient: supabaseClientData?.supabaseClient,
              clientId: selectedApp.client_id,
            })
          }
          setShowRegenerateDialog(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you wish to regenerate the client secret for "{selectedApp?.client_name}"?
          You'll need to update it in all applications that use it. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
