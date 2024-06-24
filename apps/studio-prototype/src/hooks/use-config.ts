import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type Config = {
  radius: number
  organization?: string
  project?: string
  tableEditor: {
    sidePanelOpen: boolean
  }
}

const configAtom = atomWithStorage<Config>('config', {
  radius: 0.5,
  organization: 'Summers-Muir',
  project: 'Sonsing',
  tableEditor: {
    sidePanelOpen: true,
  },
})

export function useConfig() {
  return useAtom(configAtom)
}
