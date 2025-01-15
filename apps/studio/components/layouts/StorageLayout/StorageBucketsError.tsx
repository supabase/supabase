import { useParams } from 'common'
import Link from 'next/link'
import type { ResponseError } from 'types'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

export interface StorageBucketsErrorProps {
  error: ResponseError
}

const StorageBucketsError = ({ error }: StorageBucketsErrorProps) => {
  const { ref } = useParams()

  return (
    <div className="storage-container flex items-center justify-center flex-grow">
      <div>
        <Admonition type="warning" title="Failed to fetch buckets">
          <p className="mb-1">
            Please try refreshing your browser, or contact support if the issue persists
          </p>
          <p>Error: {(error as any)?.message ?? 'Unknown'}</p>
          <Button key="contact-support" asChild type="default" className="mt-2">
            <Link
              href={`/support/new?ref=${ref}&category=dashboard_bug&subject=Unable%20to%20fetch%20storage%20buckets`}
            >
              Contact support
            </Link>
          </Button>
        </Admonition>
      </div>
    </div>
  )
}

export default StorageBucketsError
