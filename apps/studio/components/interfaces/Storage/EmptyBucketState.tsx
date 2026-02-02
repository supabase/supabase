import { BucketPlus } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'
import { CreateBucketButton } from './NewBucketButton'
import { BUCKET_TYPES } from './Storage.constants'

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
      <CreateBucketButton onClick={onCreateBucket} />
    </EmptyStatePresentational>
  )
}
