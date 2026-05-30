import { proxy } from 'valtio'

type IQueryState = {
  query: string
  setQuery: (newQuery: string) => void
}

const initQueryState = () => {
  const state: IQueryState = proxy({
    query: '',
    setQuery: (newQuery) => (state.query = newQuery),
  })
  return state
}

export { initQueryState }
export type { IQueryState }
