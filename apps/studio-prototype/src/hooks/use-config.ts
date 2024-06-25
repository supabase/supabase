import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Branch, Org, Project, orgs } from '../config/org'

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
  selectedEnv: Branch
  selectedProject?: Project
  selectedOrg?: Org
  db: {
    orgs: Org[]
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
  selectedEnv: {
    name: 'main',
    type: 'prod',
    key: 'main',
  },
  selectedProject: orgs[0].projects[0],
  selectedOrg: orgs[0],
  db: {
    orgs: [...orgs],
  },
})

export function useConfig() {
  return useAtom(configAtom)
}
