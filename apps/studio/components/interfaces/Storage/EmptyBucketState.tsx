import { InlineLink } from 'components/ui/InlineLink'
import { CreateBucketModal } from './CreateBucketModal'
import { BUCKET_TYPES } from './Storage.constants'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
}

export const EmptyBucketState = ({ bucketType }: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]

  return (
    <div className="flex flex-col justify-center h-full w-full">
      {/* TODO: pt-[8rem] or similar and include illustration */}
      <div className="w-full max-w-sm mx-auto bg-surface-100 rounded-lg px-8 pt-10 pb-8 flex flex-col gap-6 border">
        <div className="flex flex-col gap-1 text-balance">
          <h3 className="text-foreground text-xl">{config.displayName}</h3>
          <p className="text-foreground-light text-sm">
            {config.description} <InlineLink href={config.docsUrl}>Learn more</InlineLink>.
          </p>
        </div>

        {/* [Joshen] We can render the individual bucket modals here instead - where each modal has its own trigger */}
        {bucketType === 'files' && (
          <CreateBucketModal
            buttonSize="small"
            buttonType="primary"
            buttonClassName="w-fit"
            label={` New ${config.displayName.toLowerCase()} bucket`}
          />
        )}
      </div>
    </div>
  )
}
