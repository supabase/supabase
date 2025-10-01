import { PropsWithChildren } from 'react'

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
  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

  // Define navigation items for files bucket type
  const filesNavigationItems = [
    {
      label: 'Buckets',
      href: `/project/${ref}/storage/files`,
    },
    {
      label: 'Settings',
      href: `/project/${ref}/storage/settings`,
    },
    {
      label: 'Policies',
      href: `/project/${ref}/storage/policies`,
    },
  ]

  // Use provided navigationItems or default based on bucket type
  const finalNavigationItems =
    navigationItems || (bucketTypeKey === 'files' ? filesNavigationItems : [])

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
