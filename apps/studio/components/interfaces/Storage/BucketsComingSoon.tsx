import { ExternalLink, FolderClock } from 'lucide-react'
import Link from 'next/link'

import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsComingSoon = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <PageContainer>
      <PageSection>
        <PageSectionContent>
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
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
