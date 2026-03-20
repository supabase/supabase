import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import CopyButton from 'components/ui/CopyButton'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { usePlatformAppInstallationDeleteMutation } from 'data/platform-apps/platform-app-installation-delete-mutation'
import { Installation, usePrivateApps } from '../PrivateAppsContext'
import { EditScopeModal } from './EditScopeModal'

interface InstallationDetailsProps {
  installation: Installation
}

export function InstallationDetails({ installation }: InstallationDetailsProps) {
  const router = useRouter()
  const { slug: routerSlug } = router.query as { slug: string }
  const { slug, apps, removeInstallation } = usePrivateApps()

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const allProjects = projectsData?.pages.flatMap((p) => p.projects) ?? []

  const [showEditScope, setShowEditScope] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const projectScope = installation.projectScope
  const scopeProjects =
    projectScope !== 'all'
      ? allProjects.filter((p) => (projectScope as string[]).includes(p.ref))
      : []

  const { mutate: deleteInstallation, isPending: isDeleting } =
    usePlatformAppInstallationDeleteMutation({
      onSuccess: (_, vars) => {
        removeInstallation(vars.installationId)
        toast.success('App uninstalled')
        router.push(`/org/${routerSlug}/installations`)
      },
    })

  const app = apps.find((a) => a.id === installation.app_id)
  const appName = app?.name ?? installation.app_id

  function handleUninstall() {
    if (!slug) return
    deleteInstallation({ slug, installationId: installation.id })
  }

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Installation Details</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">App name</span>
                <span className="text-sm font-medium">{appName}</span>
              </div>
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">App ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{installation.app_id}</span>
                  <CopyButton type="default" iconOnly text={installation.app_id} className="px-1" />
                </div>
              </div>
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Installed</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(installation.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Project Scope</h3>
              <Button
                type="default"
                size="tiny"
                icon={<Edit size={12} />}
                onClick={() => setShowEditScope(true)}
              >
                Edit scope
              </Button>
            </div>
            <div className="border border-default rounded-lg p-4">
              {projectScope === 'all' ? (
                <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs font-medium">
                  All projects
                </span>
              ) : scopeProjects.length > 0 ? (
                <div className="space-y-2">
                  {scopeProjects.map((p) => (
                    <div key={p.ref} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
                      <span className="text-sm">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted italic">No projects selected</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <div className="border border-destructive/30 rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Uninstall app</p>
                  <p className="text-xs text-foreground-light">
                    Remove this installation and invalidate any tokens it generated
                  </p>
                </div>
                <Button
                  type="danger"
                  icon={<Trash size={14} />}
                  onClick={() => setShowUninstallModal(true)}
                >
                  Uninstall
                </Button>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <EditScopeModal
        installation={installation}
        visible={showEditScope}
        onClose={() => setShowEditScope(false)}
      />

      <ConfirmationModal
        variant="destructive"
        visible={showUninstallModal}
        title={`Uninstall "${appName}"`}
        confirmLabel="Uninstall"
        confirmLabelLoading="Uninstalling..."
        onCancel={() => setShowUninstallModal(false)}
        onConfirm={handleUninstall}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall <strong>{appName}</strong>? Any tokens generated
          through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
