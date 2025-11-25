import { ExternalLink, FolderClock } from 'lucide-react'
import Link from 'next/link'

import { ScaffoldSection } from 'components/layouts/Scaffold'
import { FilesBucket as FilesBucketIcon } from 'icons'
import { Button } from 'ui'
import { BUCKET_TYPES } from './Storage.constants'

export const BucketsComingSoon = ({ type }: { type: 'analytics' | 'vector' }) => {
  return (
    <ScaffoldSection isFullWidth>
      <aside className="border border-dashed w-full bg-surface-100 rounded-lg px-4 py-10 flex flex-col gap-y-3 items-center text-center gap-1 text-balance">
        <FolderClock size={24} strokeWidth={1.5} className="text-foreground-muted" />
        <div className="flex flex-col items-center text-center">
          <h3>Coming soon</h3>
          <p className="text-foreground-light text-sm">
            {type === 'analytics'
              ? BUCKET_TYPES.analytics.valueProp
              : type === 'vector'
                ? BUCKET_TYPES.vectors.valueProp
                : undefined}
          </p>
        </div>
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
      </aside>
    </ScaffoldSection>
  )
}
