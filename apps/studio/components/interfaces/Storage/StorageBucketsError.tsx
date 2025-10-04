import { useParams } from 'common'
import type { ResponseError } from 'types'
import { Alert } from 'ui'
import { ContactSupport } from 'components/ui/ContactSupport'

export interface StorageBucketsErrorProps {
  error: ResponseError
}

const StorageBucketsError = ({ error }: StorageBucketsErrorProps) => {
  const { ref } = useParams()

  return (
    <div className="storage-container flex items-center justify-center flex-grow">
      <div>
        <Alert
          withIcon
          variant="warning"
          title="Failed to fetch buckets"
          actions={[
            <ContactSupport
              key="contact-support"
              category={'dashboard_bug'}
              subject="Unable to fetch storage buckets"
              error={(error as any)?.message}
              className="ml-4"
              eventProperties={{
                page: 'storage_buckets',
                errorType: 'buckets_fetch_error',
              }}
            />,
          ]}
        >
          <p className="mb-1">
            Please try refreshing your browser, or contact support if the issue persists
          </p>
          <p>Error: {(error as any)?.message ?? 'Unknown'}</p>
        </Alert>
      </div>
    </div>
  )
}

export default StorageBucketsError
