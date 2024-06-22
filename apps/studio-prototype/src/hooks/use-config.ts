import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

type Config = {
  radius: number
  organization?: string
}

const configAtom = atomWithStorage<Config>('config', {
  radius: 0.5,
  organization: 'Summers-Muir',
})

export function useConfig() {
  return useAtom(configAtom)
}
