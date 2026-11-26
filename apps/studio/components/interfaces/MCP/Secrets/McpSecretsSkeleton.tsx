import { Skeleton } from 'ui'

import { InterstitialShellSkeleton } from '../InterstitialShell'
import { McpSecretsDetailsSkeleton } from './McpSecretsDetails'

export const McpSecretsSkeleton = () => (
  <InterstitialShellSkeleton>
    <McpSecretsDetailsSkeleton />
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
    <Skeleton className="h-[75px] w-full" />
  </InterstitialShellSkeleton>
)
