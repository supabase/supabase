import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Framework } from '~/registry/frameworks'

import { Style } from '~/registry/styles'
// import { Theme } from '~/registry/themes'

type Config = {
  style: Style['name']
  framework: Framework['name']
  // theme: Theme['name']
  // radius: number
}

const configAtom = atomWithStorage<Config>('config', {
  style: 'default',
  framework: 'nextjs-shadcn-app-router',
  // theme: 'zinc',
  // radius: 0.5,
})

export function useConfig() {
  return useAtom(configAtom)
}
