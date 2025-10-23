import type { OAuthClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import { Edit, MoreVertical, Plus, RotateCw, Search, Trash } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOAuthServerAppsQuery } from 'data/oauth-server-apps/oauth-server-apps-query'
import { useOAuthServerAppRegenerateSecretMutation } from 'data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
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
import { CreateOrUpdateOAuthAppModal } from './CreateOrUpdateOAuthAppModal'
import { DeleteOAuthAppModal } from './DeleteOAuthAppModal'
import OAuthAppCredentialsModal from './OAuthAppCredentialsModal'

export const OAUTH_APP_SCOPE_OPTIONS = [
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
  const [showCreateOrUpdateModal, setShowCreateOrUpdateModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<OAuthClient>()
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    clientId: string
    clientSecret: string
  } | null>(null)
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

  const { mutateAsync: regenerateSecret } = useOAuthServerAppRegenerateSecretMutation()

  const oAuthApps = data?.clients || []

  const handleEditClick = (app: OAuthClient) => {
    setSelectedApp(app)
    setShowCreateOrUpdateModal(true)
  }

  const handleDeleteClick = (app: OAuthClient) => {
    setSelectedApp(app)
    setShowDeleteModal(true)
  }

  const handleRegenerateSecret = async (app: OAuthClient) => {
    try {
      const result = await regenerateSecret({
        projectRef,
        supabaseClient: supabaseClientData?.supabaseClient,
        clientId: app.client_id,
      })

      if (result?.client_secret) {
        setGeneratedCredentials({
          clientId: app.client_id,
          clientSecret: result.client_secret,
        })
        setShowCredentialsModal(true)
      }
    } catch (error) {
      console.error('Error regenerating secret:', error)
    }
  }

  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false)
    setGeneratedCredentials(null)
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
              onClick={() => setShowCreateOrUpdateModal(true)}
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
                  <TableHead key="name">Name</TableHead>
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
                      <TableCell className="w-52 max-w-52 truncate">
                        <button type="button" onClick={() => handleEditClick(app)}>
                          {app.client_name}
                        </button>
                      </TableCell>
                      <TableCell className="w-100 max-w-64 truncate" title={app.client_id}>
                        {app.client_id}
                      </TableCell>
                      <TableCell className="max-w-40">
                        <Badge>{app.registration_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-40">
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
                            <DropdownMenuContent side="bottom" align="end" className="w-52">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => {
                                  handleEditClick(app)
                                }}
                              >
                                <Edit size={14} />
                                <p>Edit</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => handleRegenerateSecret(app)}
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

      <CreateOrUpdateOAuthAppModal
        visible={showCreateOrUpdateModal}
        onClose={() => {
          setShowCreateOrUpdateModal(false)
          setSelectedApp(undefined)
        }}
        selectedApp={selectedApp}
        onDeleteClick={handleDeleteClick}
      />
      <OAuthAppCredentialsModal
        visible={showCredentialsModal}
        onClose={handleCredentialsModalClose}
        clientId={generatedCredentials?.clientId}
        clientSecret={generatedCredentials?.clientSecret}
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
