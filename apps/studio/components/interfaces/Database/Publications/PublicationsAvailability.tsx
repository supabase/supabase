import { BookOpen } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'

export const PublicationsAvailability = ({ children }: PropsWithChildren) => {
  const { isHighAvailability } = useHighAvailability()

  if (isHighAvailability) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <HighAvailabilityDisabledEmptyState
          icon={BookOpen}
          title="Publications unavailable on High Availability projects"
          description="We're working to bring publications to High Availability projects. Contact support if this is blocking your work."
        />
      </div>
    )
  }

  return children
}
