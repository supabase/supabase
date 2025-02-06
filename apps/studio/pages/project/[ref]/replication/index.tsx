import { useParams } from 'common'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import ReplicationLayout from 'components/layouts/ReplicationLayout/ReplicationLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useCreateSourceMutation } from 'data/replication/create-source-mutation'
import { toast } from 'sonner'
import { useRouter } from 'next/router'

const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()

  const { data, error, isLoading, isError, isSuccess } = useReplicationSourcesQuery({
    projectRef: ref,
  })

  let replicationEnabled = data
    ? data?.sources?.length !== 0 && data.sources[0].name === ref
    : false

  const { mutate: createSource, isLoading: isCreating } = useCreateSourceMutation({
    onSuccess: () => {
      toast.success(`Successfully enabled replication`)
    },
  })

  return (
    <>
      <div className="py-6">
        {isLoading && <GenericSkeletonLoader />}

        {isError && <AlertError error={error} subject="Failed to retrieve replication status" />}

        {isSuccess && (
          <>
            {replicationEnabled ? (
              <ProductEmptyState
                title="Replication Enabled"
                ctaButtonLabel={'Configure replication'}
                onClickCta={() => {
                  router.push(`/project/${ref}/replication/publications`)
                }}
              >
                <p className="text-sm text-foreground-light">
                  Replication is enabled for this project. You can configure it now.
                </p>
              </ProductEmptyState>
            ) : (
              <ProductEmptyState
                title="Replication Not Enabled"
                ctaButtonLabel={'Enable replication'}
                onClickCta={() => {
                  if (!ref) return console.error('Project ref is required')
                  createSource({ projectRef: ref })
                }}
              >
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
