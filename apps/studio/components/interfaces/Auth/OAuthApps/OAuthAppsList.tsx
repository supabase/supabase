import type { OAuthClient } from '@supabase/supabase-js'
import { MoreVertical, Plus, RotateCw, Search, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOAuthServerAppRegenerateSecretMutation } from 'data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { CreateOAuthAppSheet } from './CreateOAuthAppSheet'
import { DeleteOAuthAppModal } from './DeleteOAuthAppModal'
import { NewOAuthAppBanner } from './NewOAuthAppBanner'

export const OAUTH_APP_SCOPE_OPTIONS = [
  { name: 'email', value: 'email' },
  { name: 'profile', value: 'profile' },
  { name: 'openid', value: 'openid' },
]

export const OAUTH_APP_TYPE_OPTIONS = [
  { name: 'Manual', value: 'manual' },
  { name: 'Dynamic', value: 'dynamic' },
]

export const OAuthAppsList = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, isLoading: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const isOAuthServerEnabled = !!authConfig?.OAUTH_SERVER_ENABLED
  const [newOAuthApp, setNewOAuthApp] = useState<OAuthClient | undefined>(undefined)

  // State for OAuth apps
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [selectedApp, setSelectedApp] = useState<OAuthClient>()
  const [filteredAppTypes, setFilteredAppTypes] = useState<string[]>([])
  const [filteredAppScopes, setFilteredAppScopes] = useState<string[]>([])

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { data, isLoading, isError, error } = useOAuthServerAppsQuery(
    {
      projectRef,
      supabaseClient: supabaseClientData?.supabaseClient,
    },
    { enabled: isOAuthServerEnabled }
  )

  const { mutateAsync: regenerateSecret, isLoading: isRegenerating } =
    useOAuthServerAppRegenerateSecretMutation({
      onSuccess: (data) => {
        if (data) {
          setNewOAuthApp(data)
        }
      },
    })

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
        {newOAuthApp && (
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
              options={OAUTH_APP_SCOPE_OPTIONS}
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-8"></TableHead>
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
                      <TableCell className="w-100 max-w-64 truncate" title={app.client_name}>
                        {app.client_name}
                      </TableCell>
                      <TableCell className="max-w-40" title={app.client_id}>
                        <Badge>{app.client_id}</Badge>
                      </TableCell>
                      <TableCell className="max-w-40">
                        {app.client_type === 'public' ? 'Public' : 'Private'}
                      </TableCell>
                      <TableCell className="max-w-40">
                        {app.scope ? (
                          <Badge>{app.scope}</Badge>
                        ) : (
                          <span className="text-xs text-foreground-light">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light w-1/6">
                        <TimestampInfo utcTimestamp={app.created_at} labelFormat="D MMM, YYYY" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-52">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => {
                                  setSelectedApp(app)
                                  setShowRegenerateDialog(true)
                                }}
                              >
                                <RotateCw size={14} />
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

      <CreateOAuthAppSheet
        visible={showCreateSheet}
        onSuccess={(app) => {
          setShowCreateSheet(false)
          setSelectedApp(undefined)
          setNewOAuthApp(app)
        }}
        onCancel={() => {
          setShowCreateSheet(false)
          setSelectedApp(undefined)
        }}
      />

      <DeleteOAuthAppModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        selectedApp={selectedApp}
      />

      <ConfirmationModal
        variant="warning"
        visible={showRegenerateDialog}
        loading={isRegenerating}
        title="Confirm regenerating client secret"
        confirmLabel="Confirm"
        onCancel={() => setShowRegenerateDialog(false)}
        onConfirm={() => {
          regenerateSecret({
            projectRef,
            supabaseClient: supabaseClientData?.supabaseClient,
            clientId: selectedApp?.client_id!,
          })
          setShowRegenerateDialog(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you wish to regenerate the client secret for "{selectedApp?.client_name}"?
          All existing sessions will be invalidated. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
