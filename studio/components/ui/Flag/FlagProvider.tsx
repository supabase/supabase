import { FC, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import * as configcat from 'configcat-js'

import { User } from 'types'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import FlagContext from './FlagContext'

const FlagProvider: FC = ({ children }) => {
  const { ui } = useStore()
  const { profile } = ui

  const { Provider } = FlagContext
  const [store, setStore] = useState({})
  const [client, setClient] = useState<configcat.IConfigCatClient>()

  useEffect(() => {
    // [Joshen] getFlags get triggered everytime the tab refocuses but this should be okay
    // as per https://configcat.com/docs/sdk-reference/js/#polling-modes:
    // The polling downloads the config.json at the set interval and are stored in the internal cache
    // which subsequently all getValueAsync() calls are served from there
    if (IS_PLATFORM) getFlags(profile)
  }, [profile])

  const getFlags = async (user?: User) => {
    let configcatClient = client
    if (!configcatClient) {
      configcatClient = configcat.getClient(
        process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
        configcat.PollingMode.AutoPoll,
        { pollIntervalSeconds: 10 }
      )
      setClient(configcatClient)
    }

    const flagStore: any = {}
    const flagValues =
      user !== undefined
        ? await configcatClient.getAllValuesAsync(new configcat.User(user.primary_email))
        : await configcatClient.getAllValuesAsync()
    flagValues.forEach((item: any) => {
      flagStore[item.settingKey] = item.settingValue
    })
    setStore(flagStore)
  }

  return <Provider value={store}>{children}</Provider>
}

export default observer(FlagProvider)
