import { PropsWithChildren } from 'react'

import { useParams } from 'common'
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
  const page = useStorageV2Page()
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

  return (
    <PageLayout
      title={title || (config?.displayName ?? 'Storage')}
      subtitle={
        !hideSubtitle ? config?.description || 'Manage your storage buckets and files.' : null
      }
      navigationItems={navigationItems}
      secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
    >
      <ScaffoldContainer>{children}</ScaffoldContainer>
    </PageLayout>
  )
}
