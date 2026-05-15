import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { SupportLink } from '../Support/SupportLink'
import type { ResponseError } from '@/types'

export interface StorageBucketsErrorProps {
  error: ResponseError
}

const StorageBucketsError = ({ error }: StorageBucketsErrorProps) => {
  const { ref } = useParams()

  return (
    <div className="storage-container flex items-center justify-center grow">
      <div>
        <Admonition
          type="warning"
          layout="horizontal"
          title="Failed to fetch buckets"
          description={
            <>
              <p className="mb-1">
                Please try refreshing your browser, or contact support if the issue persists
              </p>
              <p>Error: {(error as any)?.message ?? 'Unknown'}</p>
            </>
          }
          actions={
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
            </Button>
          }
        />
      </div>
    </div>
  )
}

export default StorageBucketsError
