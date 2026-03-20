import { formatDistanceToNow } from 'date-fns'
import { RotateCcw, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import CopyButton from 'components/ui/CopyButton'
import type { components } from 'api-types'
import { usePlatformAppQuery } from 'data/platform-apps/platform-app-query'
import { usePlatformAppUpdateMutation } from 'data/platform-apps/platform-app-update-mutation'
import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { PERMISSIONS } from './Apps.constants'
import { DeleteAppModal } from './DeleteAppModal'
import { PrivateApp, usePrivateApps } from '../PrivateAppsContext'

interface AppDetailsProps {
  app: PrivateApp
}

export function AppDetails({ app }: AppDetailsProps) {
  const router = useRouter()
  const { slug } = usePrivateApps()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: detail, isLoading: isLoadingDetail } = usePlatformAppQuery({ slug, id: app.id })

  const { mutate: updateApp, isPending: isUpdating } = usePlatformAppUpdateMutation({
    onSuccess: () => toast.success('App updated'),
  })

  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: () => {
      toast.success(`Deleted "${app.name}"`)
      router.push(`/org/${slug}/private-apps`)
    },
  })

  function handleDelete() {
    if (!slug) return
    deleteApp({ slug, appId: app.id })
  }

  const orgPermissions = detail
    ? detail.permissions
        .map((id) => PERMISSIONS.find((p) => p.id === id))
        .filter(Boolean)
        .filter((p) => p!.group === 'organization')
    : []

  const projectPermissions = detail
    ? detail.permissions
        .map((id) => PERMISSIONS.find((p) => p.id === id))
        .filter(Boolean)
        .filter((p) => p!.group === 'project')
    : []

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-8">
          {/* App Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">App Information</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              {/* Name */}
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Name</span>
                <span className="text-sm font-medium flex-1">{app.name}</span>
              </div>

              {/* Description */}
              <div className="flex items-start justify-between px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0 pt-0.5">
                  Description
                </span>
                <span className="text-sm flex-1 text-foreground-light">
                  {app.description || (
                    <span className="italic text-foreground-muted">No description</span>
                  )}
                </span>
              </div>

              {/* App ID */}
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">App ID</span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-mono text-sm">{app.id}</span>
                  <CopyButton type="default" iconOnly text={app.id} className="px-1" />
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Created</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Requested Permissions</h3>
            {isLoadingDetail ? (
              <div className="text-sm text-foreground-light py-4">Loading permissions...</div>
            ) : (
              <div className="border border-default rounded-lg divide-y divide-default">
                {orgPermissions.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Organization permissions
                    </p>
                    <div className="space-y-2">
                      {orgPermissions.map((p) => (
                        <div key={p!.id} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-mono">{p!.label}</p>
                            <p className="text-xs text-foreground-light">{p!.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {projectPermissions.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                      Project permissions
                    </p>
                    <div className="space-y-2">
                      {projectPermissions.map((p) => (
                        <div key={p!.id} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-mono">{p!.label}</p>
                            <p className="text-xs text-foreground-light">{p!.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {orgPermissions.length === 0 && projectPermissions.length === 0 && detail && (
                  <div className="px-4 py-6 text-center text-sm text-foreground-light">
                    No permissions configured
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Installations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Installations</h3>
            <div className="bg-surface-100 border border-default rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-foreground-light">This app hasn't been installed yet</p>
              <p className="text-xs text-foreground-muted max-w-sm">
                Install this app to specific projects to start generating tokens
              </p>
              <Button type="default" disabled>
                Create installation
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <div className="border border-destructive/30 rounded-lg divide-y divide-default">
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Rotate key pair</p>
                  <p className="text-xs text-foreground-light">
                    Generate a new key pair and invalidate the current private key
                  </p>
                </div>
                <Button type="default" icon={<RotateCcw size={14} />} disabled>
                  Rotate key
                </Button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Delete app</p>
                  <p className="text-xs text-foreground-light">
                    Permanently delete this app and all its installations
                  </p>
                </div>
                <Button
                  type="danger"
                  icon={<Trash size={14} />}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete app
                </Button>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteAppModal
        app={app}
        visible={showDeleteModal}
        isLoading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
