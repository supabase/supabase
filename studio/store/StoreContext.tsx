import DataStore from 'store/DataStore'
import UiStore from 'store/UiStore'
import { createContext } from 'react'
import { API_URL, PG_META_URL } from 'lib/constants'

export const ui = new UiStore()
export const data = new DataStore({
  apiUrl: API_URL,
  postgresApiUrl: PG_META_URL,
})

export const DataStoreContext = createContext<DataStore>(data)
export const UiStoreContext = createContext<UiStore>(ui)
