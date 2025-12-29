import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { fetchHandler } from 'data/fetchers'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

// Show the banner if the clock skew is greater than 2 minutes
const CLOCK_SKEW_THRESHOLD = 2 * 60 * 1000
// check every 5 minutes
const CLOCK_SKEW_CHECK_INTERVAL = 30 * 60 * 1000

const isClockSkewed = async () => {
  try {
    const response = await fetchHandler(`${BASE_PATH}/api/get-utc-time`)
    const data = await response.json()
    // The received time is in UTC timezone, add Z at the end to make JS understand that
    const serverTime = new Date(data.utcTime).getTime()
    const clientTime = new Date().getTime()
    const clockSkew = Math.abs(clientTime - serverTime)

    return clockSkew > CLOCK_SKEW_THRESHOLD
  } catch {
    return false
  }
}

export const ClockSkewBanner = () => {
  const [clockSkew, setClockSkew] = useState(false)

  const checkClockSkew = useCallback(async () => {
    const value = await isClockSkewed()
    setClockSkew(value)
  }, [])

  useEffect(() => {
    // check for clock skew every CLOCK_SKEW_CHECK_INTERVAL
    checkClockSkew()
    const interval = setInterval(checkClockSkew, CLOCK_SKEW_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [checkClockSkew])

  if (!clockSkew) return null

  return (
    <HeaderBanner
      variant="warning"
      title="Your computer’s clock appears to be inaccurate"
      description={
        <>
          This can cause issues with certain features.{' '}
          <Link
            href={`${DOCS_URL}/guides/troubleshooting/jwt-expired-error-in-supabase-dashboard-F06k3x`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </Link>
        </>
      }
    />
  )
}
