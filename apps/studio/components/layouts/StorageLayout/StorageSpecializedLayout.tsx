import { PropsWithChildren } from 'react'

import { BUCKET_TYPES, BUCKET_TYPE_KEYS } from 'components/interfaces/Storage/Storage.constants'
import { DocsButton } from 'components/ui/DocsButton'
import { PageLayout } from '../PageLayout/PageLayout'
import { ScaffoldContainer } from '../Scaffold'

interface StorageSpecializedLayoutProps extends PropsWithChildren {
  bucketType: (typeof BUCKET_TYPE_KEYS)[number]
}

export const StorageSpecializedLayout = ({
  children,
  bucketType,
}: StorageSpecializedLayoutProps) => {
  const config = BUCKET_TYPES[bucketType]
  return (
    <PageLayout
      title={config?.displayName || 'Storage'}
      subtitle={config?.description || 'Manage your storage buckets and files.'}
      secondaryActions={[<DocsButton key="docs" href={config.docsUrl} />]}
    >
      <ScaffoldContainer>{children}</ScaffoldContainer>
    </PageLayout>
  )
}
