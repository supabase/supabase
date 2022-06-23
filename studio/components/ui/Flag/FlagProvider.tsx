import { FC, useEffect, useState } from 'react'
import createConfigCatClient from 'configcat-js'
import FlagContext from './FlagContext'
import { IS_PLATFORM } from 'lib/constants'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { User } from 'types'

const FlagProvider: FC = ({ children }) => {
  const [store, setStore] = useState({})
  const { ui } = useStore()
  const { Provider } = FlagContext
  const { profile } = ui

  useEffect(() => {
    if (IS_PLATFORM) getFlags(profile)
  }, [profile])

  const getFlags = async (user?: User) => {
    const setFlagValues = async () => {
      const flagValues =
        user !== undefined
          ? await client.getAllValuesAsync({ identifier: user.primary_email })
          : await client.getAllValuesAsync()
      const flagStore: any = {}

      flagValues.forEach((item: any) => {
        flagStore[item.settingKey] = item.settingValue
      })
      setStore(flagStore)
    }

    const client = createConfigCatClient(process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '', {
      configChanged: setFlagValues,
      pollIntervalSeconds: 600,
    })

    await setFlagValues()
  }

  return <Provider value={store}>{children}</Provider>
}

export default observer(FlagProvider)
