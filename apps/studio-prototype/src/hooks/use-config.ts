import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type Config = {
  radius: number
  organization?: string
  project?: string
  tableEditor: {
    sidePanelOpen: boolean
    activeTabId: number
    itemsOpen: boolean
    queriesOpen: boolean
    privateQueriesOpen?: boolean
  }
  env: {
    type: 'prod' | 'preview' | 'long-running'
    name: string
  }
}

const configAtom = atomWithStorage<Config>('config', {
  radius: 0.5,
  organization: 'summersmuir',
  project: 'Sonsing',
  tableEditor: {
    sidePanelOpen: true,
    activeTabId: 1,
    itemsOpen: true,
    queriesOpen: true,
    privateQueriesOpen: true,
  },
  env: {
    type: 'prod',
    name: 'name',
  },
})

export function useConfig() {
  return useAtom(configAtom)
}
