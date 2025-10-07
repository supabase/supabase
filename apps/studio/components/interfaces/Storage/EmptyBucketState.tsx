import { CreateBucketModal } from './CreateBucketModal'
import { CreateSpecializedBucketModal } from './CreateSpecializedBucketModal'
import { BUCKET_TYPES } from './Storage.constants'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
}

export const EmptyBucketState = ({ bucketType }: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <aside className="mt-12 border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-6 items-center text-center gap-1 text-balance">
      <div className="flex flex-col gap-1">
        <h3>Create {config.label}</h3>
        <p className="text-foreground-light text-sm">{config.valueProp}</p>
      </div>

      {/* [Joshen] We can render the individual bucket modals here instead - where each modal has its own trigger */}
      {bucketType === 'files' && (
        <CreateBucketModal buttonSize="tiny" buttonType="primary" buttonClassName="w-fit" />
      )}
      {/* [Danny] Convert above and below into single ternary after vector bucket is supported */}
      {/* i.e. bucketType === 'files' ? <CreateFileBucketModal /> : <CreateSpecializedBucketModal bucketType={bucketType} />  */}
      {bucketType === 'analytics' && (
        <CreateSpecializedBucketModal
          bucketType="analytics"
          buttonSize="tiny"
          buttonType="primary"
          buttonClassName="w-fit"
        />
      )}
      {/* {bucketType === 'vectors' && (
        <CreateSpecializedBucketModal
          bucketType="vectors"
          buttonSize="tiny"
          buttonType="primary"
          buttonClassName="w-fit"
        />
      )} */}
    </aside>
  )
}
