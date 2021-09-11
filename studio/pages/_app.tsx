import '../styles/globals.css'
import DataStore from 'store/DataStore'
import UiStore from 'store/UiStore'
import type { AppProps } from 'next/app'
import { observer } from 'mobx-react-lite'
import { DataStoreContext, UiStoreContext, data, ui } from 'store/StoreContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DataStoreContext.Provider value={data}>
      <UiStoreContext.Provider value={ui}>
        <Component {...pageProps} />
      </UiStoreContext.Provider>
    </DataStoreContext.Provider>
  )
}
export default observer(MyApp)
