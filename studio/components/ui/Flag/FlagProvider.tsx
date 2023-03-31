import { User } from '@supabase/supabase-js'
import { PropsWithChildren, useEffect, useState } from 'react'
import * as configcat from 'configcat-js'

import { IS_PLATFORM } from 'lib/constants'
import FlagContext from './FlagContext'
import { useUser } from 'lib/auth'

let client: configcat.IConfigCatClient

const FlagProvider = ({ children }: PropsWithChildren<{}>) => {
  const user = useUser()

  const { Provider } = FlagContext
  const [store, setStore] = useState({})

  const getFlags = async (user?: User) => {
    if (!client) {
      client = configcat.getClient(
        process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
        configcat.PollingMode.AutoPoll,
        { pollIntervalSeconds: 600 }
      )
    }

    const flagStore: any = {}
    const flagValues =
      user?.email !== undefined
        ? await client.getAllValuesAsync(new configcat.User(user.email))
        : await client.getAllValuesAsync()
    flagValues.forEach((item: any) => {
      flagStore[item.settingKey] = item.settingValue
    })
    setStore(flagStore)
  }

  useEffect(() => {
    // [Joshen] getFlags get triggered everytime the tab refocuses but this should be okay
    // as per https://configcat.com/docs/sdk-reference/js/#polling-modes:
    // The polling downloads the config.json at the set interval and are stored in the internal cache
    // which subsequently all getValueAsync() calls are served from there
    if (IS_PLATFORM) getFlags(user ?? undefined)
  }, [user])

  return <Provider value={store}>{children}</Provider>
}

export default FlagProvider
