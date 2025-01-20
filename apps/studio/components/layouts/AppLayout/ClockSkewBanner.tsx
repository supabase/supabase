import { BASE_PATH } from 'lib/constants'
import { useCallback, useEffect, useState } from 'react'
import { Button } from 'ui'

// Show the banner if the clock skew is greater than 2 minutes
const CLOCK_SKEW_THRESHOLD = 2 * 60 * 1000
// check every 5 minutes
const CLOCK_SKEW_CHECK_INTERVAL = 30 * 60 * 1000

const isClockSkewed = async () => {
  try {
    const response = await fetch(`${BASE_PATH}/api/get-utc-time`)
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
    <div
      style={{ height: '44px' }}
      className="flex items-center justify-center gap-x-4 bg-destructive-400 py-3 transition text-foreground box-border border-b border-default"
    >
      <p className="text-sm">
        Your computer's clock appears to be inaccurate. This can cause issues with certain features.
      </p>
      <Button asChild type="default">
        <a href="https://supabase.com/docs" target="_blank">
          More information
        </a>
      </Button>
    </div>
  )
}
