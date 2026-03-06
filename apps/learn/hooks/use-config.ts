import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ComponentProps } from 'react'
import { SonnerToaster } from 'ui'

type Config = {
  style: string
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
