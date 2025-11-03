import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'

import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useSelectedBucket } from 'components/interfaces/Storage/StorageExplorer/useSelectedBucket'
import { StorageMenu } from 'components/interfaces/Storage/StorageMenu'
import { StorageMenuV2 } from 'components/interfaces/Storage/StorageMenuV2'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()
  const { ref, featurePreviewModal, bucketId } = useParams()
  const { bucket } = useSelectedBucket()

  // [Joshen] Handle redirects between existing UI and feature preview
  useEffect(() => {
    const { pathname } = router
    const suffix = !!featurePreviewModal ? `?featurePreviewModal=${featurePreviewModal}` : ''

    if (!ref) return

    if (isStorageV2) {
      // From old UI to new UI
      if (pathname.endsWith('/storage/settings')) {
        router.push(`/project/${ref}/storage/files/settings${suffix}`)
      } else if (pathname.endsWith('/storage/policies')) {
        router.push(`/project/${ref}/storage/files/policies${suffix}`)
      } else if (pathname.endsWith('/storage/buckets/[bucketId]')) {
        if (!!bucket && bucket.type === 'STANDARD') {
          router.push(`/project/${ref}/storage/files/buckets/${bucketId}${suffix}`)
        } else if (!!bucket && bucket.type === 'ANALYTICS') {
          router.push(`/project/${ref}/storage/analytics/buckets/${bucketId}${suffix}`)
        }
      }
    } else {
      // From new UI to old UI
      if (pathname.endsWith('/files/settings')) {
        router.push(`/project/${ref}/storage/settings${suffix}`)
      } else if (pathname.endsWith('/files/policies')) {
        router.push(`/project/${ref}/storage/policies${suffix}`)
      } else if (
        pathname.endsWith('/files/buckets/[bucketId]') ||
        pathname.endsWith('/analytics/buckets/[bucketId]')
      ) {
        router.push(`/project/${ref}/storage/buckets/${bucketId}${suffix}`)
      } else if (
        pathname.endsWith('/storage/files') ||
        pathname.endsWith('/storage/analytics') ||
        pathname.endsWith('/storage/vectors')
      ) {
        router.push(`/project/${ref}/storage/buckets`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, isStorageV2])

  return (
    <ProjectLayout
      stickySidebarBottom={isStorageV2 ? false : true}
      title={title || 'Storage'}
      product="Storage"
      productMenu={isStorageV2 ? <StorageMenuV2 /> : <StorageMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)
