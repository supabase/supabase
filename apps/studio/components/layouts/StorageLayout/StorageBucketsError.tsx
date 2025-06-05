import { useParams } from 'common'
import { ContactSupportButton } from 'components/ui/ContactSupportButton'
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
            <ContactSupportButton
              key="contact-support"
              category="DASHBOARD_BUG"
              subject="Unable to fetch storage buckets"
              message="I'm unable to fetch storage buckets"
              projectRef={ref}
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
