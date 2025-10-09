import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { useStorageV2Page } from 'components/interfaces/Storage/Storage.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { PageLayout } from '../PageLayout/PageLayout'
import { ScaffoldContainer } from '../Scaffold'

export const StorageBucketsLayout = ({
  title,
  hideSubtitle = false,
  children,
}: PropsWithChildren<{ title?: string; hideSubtitle?: boolean }>) => {
  const { ref } = useParams()
  const router = useRouter()
  const page = useStorageV2Page()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const config = !!page && page !== 's3' ? BUCKET_TYPES[page] : undefined

  const navigationItems =
    page === 'files'
      ? [
          {
            label: 'Buckets',
            href: `/project/${ref}/storage/files`,
          },
          {
            label: 'Settings',
            href: `/project/${ref}/storage/files/settings`,
          },
          {
            label: 'Policies',
            href: `/project/${ref}/storage/files/policies`,
          },
        ]
      : []

  useEffect(() => {
    if (!isStorageV2) router.replace(`/project/${ref}/storage/buckets`)
  }, [isStorageV2, ref, router])

  return (
    <PageLayout
      title={title || (config?.displayName ?? 'Storage')}
      subtitle={
        hideSubtitle ? config?.description || 'Manage your storage buckets and files.' : null
      }
      navigationItems={navigationItems}
      secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
    >
      <ScaffoldContainer>{children}</ScaffoldContainer>
    </PageLayout>
  )
}
