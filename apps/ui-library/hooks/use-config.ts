// import { Theme } from '@/registry/themes'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ComponentProps } from 'react'
import { SonnerToaster } from 'ui'

import { Style } from '@/registry/styles'

type Config = {
  style: Style['name']
  radius: number
  sonnerPosition: ComponentProps<typeof SonnerToaster>['position']
  sonnerExpand: boolean
}

const configAtom = atomWithStorage<Config>('config', {
  style: 'default',
  radius: 0.5,
  sonnerPosition: 'bottom-right',
  sonnerExpand: false,
})

export function useConfig() {
  return useAtom(configAtom)
}
