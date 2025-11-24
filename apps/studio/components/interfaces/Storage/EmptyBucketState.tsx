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
      <BucketPlus size={24} strokeWidth={1.5} className="text-foreground-muted" />

      <div className="flex flex-col items-center text-center">
        <h3>
          Create {config.article} {config.singularName} bucket
        </h3>
        <p className="text-foreground-light text-sm">{config.valueProp}</p>
      </div>

      {bucketType === 'files' && (
        <CreateBucketModal
          open={false}
          onOpenChange={function (value: boolean): void {
            throw new Error('Function not implemented.')
          }}
        />
      )}
      {bucketType === 'analytics' && (
        <CreateAnalyticsBucketModal
          open={false}
          onOpenChange={function (value: boolean): void {
            throw new Error('Function not implemented.')
          }}
        />
      )}
      {bucketType === 'vectors' && <CreateVectorBucketButton onClick={() => onCreateBucket?.()} />}
    </EmptyStatePresentational>
  )
}
