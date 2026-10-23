import { useFlag, useParams } from 'common'
import Link from 'next/link'

import { useHighAvailability } from '@/hooks/misc/useHighAvailability'

// Temporary for the legacy API key sunset (target removal Q1 2027), see SEC-998.
export const useIsLegacyAPIKeysLinkEnabled = () => useFlag('legacyApiKeysPopover')

export const LegacyAPIKeysLink = () => {
  const { ref: projectRef } = useParams()
  const { isHighAvailability } = useHighAvailability()

  if (isHighAvailability) return null

  return (
    <p className="text-center text-sm text-foreground-lighter pt-8">
      Looking for legacy keys?{' '}
      <Link
        href={`/project/${projectRef}/settings/api-keys/legacy`}
        className="underline hover:text-foreground-light"
      >
        Click here
      </Link>
    </p>
  )
}
