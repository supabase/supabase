import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import type { ResponseError } from 'types'
import { Alert, Button } from 'ui'
import { SupportLink } from '../Support/SupportLink'

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
              <SupportLink
                queryParams={{
                  projectRef: ref,
                  category: SupportCategories.DASHBOARD_BUG,
                  subject: 'Unable to fetch storage buckets',
                }}
              >
                Contact support
              </SupportLink>
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
