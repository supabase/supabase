import { useEffect, useState } from 'react'

import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'
import { useClockSkewQuery } from 'data/misc/clock-skew-query'
import { DOCS_URL } from 'lib/constants'

export const ClockSkewBanner = () => {
  const [isClockSkewed, setIsClockSkewed] = useState(false)

  const { data } = useClockSkewQuery()
  useEffect(() => setIsClockSkewed(!!data), [data])

  if (!isClockSkewed) return null

  return (
    <HeaderBanner
      variant="warning"
      title="Your computer’s clock appears to be inaccurate"
      description={
        <>
          This can cause issues with certain features.{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/troubleshooting/jwt-expired-error-in-supabase-dashboard-F06k3x`}
          >
            Learn more
          </InlineLink>
        </>
      }
    />
  )
}
