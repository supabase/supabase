import { ExternalLink, FolderClock } from 'lucide-react'
import Link from 'next/link'

import { ScaffoldSection } from 'components/layouts/Scaffold'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsComingSoon = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <EmptyStatePresentational
        icon={FolderClock}
        title="Coming soon"
        description={
          type === 'analytics'
            ? BUCKET_TYPES.analytics.valueProp
            : type === 'vector'
              ? BUCKET_TYPES.vectors.valueProp
              : undefined
        }
      >
        {type === 'analytics' && (
          <Button asChild type="default" icon={<ExternalLink />}>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://forms.supabase.com/analytics-buckets"
            >
              Request access
            </Link>
          </Button>
        )}
      </EmptyStatePresentational>
    </ScaffoldSection>
  )
}
