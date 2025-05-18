import { useParams } from 'common'
import Link from 'next/link'
import type { ResponseError } from 'types'
import { Alert, Button } from 'ui'

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
            <Button key="contact-support" asChild type="default" className="ml-4">
              <Link
                href={`/support/new?projectRef=${ref}&category=dashboard_bug&subject=Unable%20to%20fetch%20storage%20buckets`}
              >
                Contact support
              </Link>
            </Button>,
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
