import { BucketAdd } from 'icons'
import { CreateBucketModal } from './CreateBucketModal'
import { BUCKET_TYPES } from './Storage.constants'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
}

export const EmptyBucketState = ({ bucketType }: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <aside className="mt-12 border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-4 items-center text-center gap-1 text-balance">
      <div className="flex flex-col gap-3 items-center text-center">
        <BucketAdd size={24} strokeWidth={1.5} className="text-foreground-muted" />
        <div className="flex flex-col gap-1">
          <h3>Create {config.label}</h3>
          <p className="text-foreground-light text-sm">{config.valueProp}</p>
        </div>
      </div>

      {/* [Joshen] We can render the individual bucket modals here instead - where each modal has its own trigger */}
      {/* [Danny] CreateBucketModal needs to be split into CreateFileBucketModal, CreateAnalyticsBucketModal, CreateVectorsBucketModal */}
      {bucketType === 'files' && (
        <CreateBucketModal buttonSize="tiny" buttonType="primary" buttonClassName="w-fit" />
      )}
    </aside>
  )
}
