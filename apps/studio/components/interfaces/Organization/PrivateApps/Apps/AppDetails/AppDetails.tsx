import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { usePlatformAppQuery } from 'data/platform-apps/platform-app-query'
import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { PERMISSIONS, type Permission } from '../Apps.constants'
import { DeleteAppModal } from '../DeleteAppModal'
import { PrivateApp, usePrivateApps } from '../../PrivateAppsContext'
import { AppInformation } from './AppInformation'
import { AppPermissions } from './AppPermissions'
import { AppInstallations } from './AppInstallations'
import { AppDangerZone } from './AppDangerZone'

interface AppDetailsProps {
  app: PrivateApp
}

export function AppDetails({ app }: AppDetailsProps) {
  const router = useRouter()
  const { slug } = usePrivateApps()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: detail, isLoading: isLoadingDetail } = usePlatformAppQuery({ slug, id: app.id })

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

  const { orgPermissions, projectPermissions } = useMemo(() => {
    const resolved: Permission[] = detail
      ? detail.permissions
          .map((id) => PERMISSIONS.find((p) => p.id === id))
          .filter((p): p is Permission => p !== undefined)
      : []

    return {
      orgPermissions: resolved.filter((p) => p.group === 'organization'),
      projectPermissions: resolved.filter((p) => p.group === 'project'),
    }
  }, [detail])

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-8">
          <AppInformation app={app} />
          <AppPermissions
            orgPermissions={orgPermissions}
            projectPermissions={projectPermissions}
            isLoading={isLoadingDetail}
            isLoaded={!!detail}
          />
          <AppInstallations />
          <AppDangerZone onDelete={() => setShowDeleteModal(true)} />
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
