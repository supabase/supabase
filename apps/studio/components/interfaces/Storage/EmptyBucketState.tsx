import { BucketPlus } from 'icons'
import { EmptyState } from 'ui-patterns'
import { CreateAnalyticsBucketModal } from './AnalyticsBuckets/CreateAnalyticsBucketModal'
import { CreateBucketModal } from './CreateBucketModal'
import { BUCKET_TYPES } from './Storage.constants'
import { CreateVectorBucketDialog } from './VectorBuckets/CreateVectorBucketDialog'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
  className?: string
}

export const EmptyBucketState = ({ bucketType, className }: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <EmptyState
      icon={BucketPlus}
      title={`Create ${config.article} ${config.singularName} bucket`}
      description={config.valueProp}
      className={className}
    >
      {bucketType === 'files' && (
        <CreateBucketModal buttonSize="tiny" buttonType="primary" buttonClassName="w-fit" />
      )}
      {bucketType === 'analytics' && (
        <CreateAnalyticsBucketModal
          buttonSize="tiny"
          buttonType="primary"
          buttonClassName="w-fit"
        />
      )}
      {bucketType === 'vectors' && <CreateVectorBucketDialog />}
    </EmptyState>
  )
}
