import { FC, PropsWithChildren, useEffect, useState } from 'react'
// import createConfigCatClient from 'configcat-js'
import FlagContext from './FlagContext'

const FlagProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const [store, setStore] = useState({})
  const { Provider } = FlagContext

  // useEffect(() => {
  //   getFlags()
  // }, [])

  // const getFlags = async () => {
  //   const setFlagValues = async () => {
  //     const flagValues = await client.getAllValuesAsync()
  //     const flagStore: any = {}

  //     flagValues.forEach((item: any) => {
  //       flagStore[item.settingKey] = item.settingValue
  //     })
  //     setStore(flagStore)
  //   }

  //   const client = createConfigCatClient(process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '', {
  //     configChanged: setFlagValues,
  //     pollIntervalSeconds: 600,
  //   })

  //   await setFlagValues()
  // }

  return <Provider value={store}>{children}</Provider>
}

export default FlagProvider
