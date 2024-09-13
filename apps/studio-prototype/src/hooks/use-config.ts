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
  isChangingProject?: boolean
  selectedEnv: Branch
  settingsAllPreviews?: boolean
  selectedProject?: Project
  selectedOrg?: Org
  activeTab?: number
  stickySidebar?: boolean
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
    queriesOpen: false,
    privateQueriesOpen: true,
  },
  isChangingProject: false,
  selectedEnv: {
    name: 'main',
    type: 'prod',
    key: 'main',
  },
  settingsAllPreviews: false,
  selectedProject: orgs[0].projects[0],
  selectedOrg: orgs[0],
  stickySidebar: false,
  db: {
    orgs: [...orgs],
  },
})

export function useConfig() {
  return useAtom(configAtom)
}
