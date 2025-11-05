import { BucketAdd } from 'icons'
import { cn } from 'ui'
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
    <aside
      className={cn(
        'border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-3 items-center text-center text-balance',
        className
      )}
    >
      <BucketAdd size={24} strokeWidth={1.5} className="text-foreground-muted" />

      <div className="flex flex-col items-center text-center">
        <h3>
          Create {config.article} {config.singularName} bucket
        </h3>
        <p className="text-foreground-light text-sm">{config.valueProp}</p>
      </div>

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
    </aside>
  )
}
