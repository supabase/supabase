import { Skeleton } from 'ui'

import { McpElicitationDetailsSkeleton } from './McpElicitationDetails'
import { InterstitialLayout, SupabaseLogo } from '@/components/layouts/InterstitialLayout'

/**
 * Reserves the header, trust line and details table at their resolved heights
 * so the card doesn't jump when the request arrives.
 */
export const McpElicitationSkeleton = () => (
  <InterstitialLayout
    logo={<SupabaseLogo />}
    title={<Skeleton className="h-[18px] w-40" />}
    description={
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    }
  >
    <div className="flex flex-col gap-6 px-6 pb-6">
      <Skeleton className="h-[38px] w-full" />
      <McpElicitationDetailsSkeleton />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-[34px] w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-[34px] w-full" />
        </div>
      </div>
    </div>
  </InterstitialLayout>
)
