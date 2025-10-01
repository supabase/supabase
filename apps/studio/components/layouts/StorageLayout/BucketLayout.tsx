import { PropsWithChildren } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { BUCKET_TYPES, DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import { DocsButton } from 'components/ui/DocsButton'
import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import { ScaffoldContainer } from '../Scaffold'
import StorageLayout from './StorageLayout'

interface BucketTypeLayoutProps extends PropsWithChildren {
  navigationItems?: Array<{
    id?: string
    label: string
    href?: string
    icon?: React.ReactNode
    onClick?: () => void
    badge?: string
    active?: boolean
  }>
  isEmpty?: boolean
}

export const BucketTypeLayout = ({ children, navigationItems, isEmpty }: BucketTypeLayoutProps) => {
  const { bucketType, ref } = useParams()
  const router = useRouter()
  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

  // Check if we're on a files sub-route (settings or policies)
  const isOnFilesSubRoute = router.asPath.includes('/storage/files/')

  // Define navigation items for files bucket type
  const filesNavigationItems = [
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

  // Use provided navigationItems or default based on bucket type
  // Show files navigation items if we're on files bucket type OR on a files sub-route
  const finalNavigationItems =
    navigationItems || (bucketTypeKey === 'files' || isOnFilesSubRoute ? filesNavigationItems : [])

  return (
    <DefaultLayout>
      <StorageLayout title="Storage">
        {isEmpty ? (
          // For empty state, render directly without PageLayout/ScaffoldContainer
          children
        ) : (
          // For normal state, use PageLayout with ScaffoldContainer
          <PageLayout
            title={config?.displayName || 'Storage'}
            subtitle={config?.description || 'Manage your storage buckets and files.'}
            navigationItems={finalNavigationItems}
            secondaryActions={[<DocsButton key="docs" href={config.docsUrl} />]}
          >
            <ScaffoldContainer>{children}</ScaffoldContainer>
          </PageLayout>
        )}
      </StorageLayout>
    </DefaultLayout>
  )
}
