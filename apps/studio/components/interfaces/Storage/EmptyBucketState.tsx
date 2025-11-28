import { BucketPlus } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'
import { CreateAnalyticsBucketModal } from './AnalyticsBuckets/CreateAnalyticsBucketModal'
import { CreateBucketModal } from './CreateBucketModal'
import { BUCKET_TYPES } from './Storage.constants'
import { CreateVectorBucketButton } from './VectorBuckets/CreateVectorBucketDialog'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
  className?: string
  onCreateBucket?: () => void
}

export const EmptyBucketState = ({
  bucketType,
  className,
  onCreateBucket,
}: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <EmptyStatePresentational
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
      {bucketType === 'vectors' && <CreateVectorBucketButton onClick={onCreateBucket} />}
    </EmptyStatePresentational>
  )
}
