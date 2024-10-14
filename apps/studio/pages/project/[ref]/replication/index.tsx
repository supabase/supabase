import { useParams } from 'common'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { data, error, isLoading, isError, isSuccess } = useReplicationSourcesQuery( { projectRef: ref })
  let replicationEnabled = data?.length !== 0

  return (
    <>
      <div className="py-6">
        {isLoading && <GenericSkeletonLoader />}

        {isError && <AlertError error={error} subject="Failed to retrieve replication status" />}

        {isSuccess && (
          <>
            {replicationEnabled ? (
                <div>Filled State</div>
            ) : (
                <ProductEmptyState title="Replication" ctaButtonLabel={'Enable replication'}>
                    <p className="text-sm text-foreground-light">
                        Replication is not enabled for this project.
                    </p>
                </ProductEmptyState>
            )}
          </>
        )}
      </div>
    </>
  )
}

PageLayout.getLayout = (page) => <ReplicationLayout title={'Replication'}>{page}</ReplicationLayout>

export default PageLayout
