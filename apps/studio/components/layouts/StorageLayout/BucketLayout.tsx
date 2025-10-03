import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { BUCKET_TYPES, DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import { DocsButton } from 'components/ui/DocsButton'
import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import { ScaffoldContainer } from '../Scaffold'
import StorageLayout from './StorageLayout'

export const BucketTypeLayout = ({ children }: PropsWithChildren) => {
  const { bucketType } = useParams()
  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]
  const secondaryActions = [<DocsButton key="docs" href={config.docsUrl} />]

  return (
    <DefaultLayout>
      <StorageLayout title="Storage">
        <PageLayout
          title={`${config?.displayName || 'Storage'} Buckets`}
          subtitle={config?.description || 'Manage your storage buckets and files.'}
          secondaryActions={secondaryActions}
        >
          <ScaffoldContainer>{children}</ScaffoldContainer>
        </PageLayout>
      </StorageLayout>
    </DefaultLayout>
  )
}
