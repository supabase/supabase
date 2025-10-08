import { BucketAdd } from 'icons'
import { CreateBucketModal } from './CreateBucketModal'
import { CreateSpecializedBucketModal } from './CreateSpecializedBucketModal'
import { BUCKET_TYPES } from './Storage.constants'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
}

export const EmptyBucketState = ({ bucketType }: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <aside className="mt-12 border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-3 items-center text-center gap-1 text-balance">
      <BucketAdd size={24} strokeWidth={1.5} className="text-foreground-muted" />
      <div className="flex flex-col items-center text-center">
        <h3>
          Create {config.article} {config.singularName} bucket
        </h3>
        <p className="text-foreground-light text-sm">{config.valueProp}</p>
      </div>

      {bucketType === 'files' ? (
        <CreateBucketModal buttonSize="tiny" buttonType="primary" buttonClassName="w-fit" />
      ) : (
        <CreateSpecializedBucketModal
          bucketType={bucketType}
          buttonSize="tiny"
          buttonType="primary"
          buttonClassName="w-fit"
          disabled={bucketType === 'vectors'}
          tooltip={
            bucketType === 'vectors'
              ? {
                  content: {
                    side: 'bottom',
                    text: 'Vector buckets are not supported yet',
                  },
                }
              : undefined
          }
        />
      )}
    </aside>
  )
}
