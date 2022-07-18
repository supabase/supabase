import { FC, useEffect, useState } from 'react'
import { Subscription } from '@supabase/gotrue-js'

import { auth } from 'lib/gotrue'
import Connecting from 'components/ui/Loading'
import { doesTokenDataExist } from './GoTrueWrapper.utils'

/**
 * On app first load, gotrue client may take a while to refresh access token
 * We have to wait for that process to complete before showing children components
 */
const GoTrueWrapper: FC = ({ children }) => {
  const [loading, setLoading] = useState(doesTokenDataExist())

  useEffect(() => {
    let subscription: Subscription | null
    let timer: any
    const currentSession = auth.session()

    function tokenRefreshed() {
      setLoading(false)
      // clean subscription
      if (subscription) subscription.unsubscribe()
      // clean timer
      if (timer) clearTimeout(timer)
    }

    if (currentSession != undefined && currentSession != null) {
      // if there is an active session, go ahead
      setLoading(false)
    } else {
      // else wait for TOKEN_REFRESHED event before continue
      const response = auth.onAuthStateChange((_event, session) => {
        if (loading && _event === 'TOKEN_REFRESHED') {
          tokenRefreshed()
        }
      })
      subscription = response.data ?? null

      // we need a timeout here, in case token refresh fails
      timer = setTimeout(() => setLoading(false), 5 * 1000)
    }

    return () => {
      if (subscription) subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return <>{loading ? <Connecting /> : children}</>
}

export default GoTrueWrapper
