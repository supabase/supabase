import { useParams } from 'common'
import Link from 'next/link'
import { ResponseError } from 'types'
import { Alert, Button } from 'ui'

export interface StorageBucketsErrorProps {
  error: ResponseError
}

const StorageBucketsError = ({ error }: StorageBucketsErrorProps) => {
  const { ref } = useParams()

  return (
    <div className="storage-container flex flex items-center justify-center flex-grow">
      <div>
        <Alert
          withIcon
          variant="warning"
          title="Failed to fetch buckets"
          actions={[
            <Link
              key="contact-support"
              href={`/support/new?ref=${ref}&category=dashboard_bug&subject=Unable%20to%20fetch%20storage%20buckets`}
            >
              <a>
                <Button type="default" className="ml-4">
                  Contact support
                </Button>
              </a>
            </Link>,
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
