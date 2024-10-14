import type { User } from '@supabase/supabase-js'
import { FlagValues } from '@vercel/flags/react'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useUser } from 'lib/auth'
import { getFlags } from 'lib/configcat'
import { IS_PLATFORM } from 'lib/constants'
import FlagContext from './FlagContext'

var getCookies = function () {
  var pairs = document.cookie.split(';')
  var cookies: Record<string, string> = {}
  for (var i = 0; i < pairs.length; i++) {
    var [t_key, value] = pairs[i].split('=')
    const key = t_key.trim()

    cookies[key] = unescape(value)
  }
  return cookies
}

const FlagProvider = ({ children }: PropsWithChildren<{}>) => {
  const user = useUser()

  const { Provider } = FlagContext
  const [store, setStore] = useState({})

  const processFlags = async (user?: User) => {
    const flagStore: any = {}
    const flagValues = await getFlags(user)
    let overridesCookieValue: Record<string, boolean> = {}
    try {
      const cookies = getCookies()
      overridesCookieValue = JSON.parse(cookies['vercel-flag-overrides'])
    } catch {}

    flagValues.forEach((item) => {
      flagStore[item.settingKey] = overridesCookieValue[item.settingKey] ?? item.settingValue
    })
    setStore(flagStore)
  }

  useEffect(() => {
    // [Joshen] getFlags get triggered everytime the tab refocuses but this should be okay
    // as per https://configcat.com/docs/sdk-reference/js/#polling-modes:
    // The polling downloads the config.json at the set interval and are stored in the internal cache
    // which subsequently all getValueAsync() calls are served from there
    if (IS_PLATFORM) processFlags(user ?? undefined)
  }, [user])

  return (
    <Provider value={store}>
      <FlagValues values={store} />
      {children}
    </Provider>
  )
}

export default FlagProvider
