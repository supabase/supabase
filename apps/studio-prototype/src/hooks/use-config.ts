import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { orgs } from '../config/org'

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
  selectedProject?: (typeof orgs)[0]['projects'][0]
  selectedOrg?: (typeof orgs)[0]
  db: any
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
  selectedProject: undefined,
  selectedOrg: undefined,
  db: {
    orgs: { ...orgs },
  },
})

export function useConfig() {
  return useAtom(configAtom)
}
