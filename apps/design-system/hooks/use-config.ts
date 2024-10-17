import { Style } from '@/registry/styles'
import { Theme } from '@/registry/themes'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ComponentProps } from 'react'
import { SonnerToaster } from 'ui'
// import { BackendProvider } from '@/registry/backend-provider'

type Config = {
  style: Style['name']
  theme: Theme['name']
  radius: number
  sonnerPosition: ComponentProps<typeof SonnerToaster>['position']
  sonnerExpand: boolean
  // backendProvider: BackendProvider['name'] | undefined
}

const configAtom = atomWithStorage<Config>('config', {
  style: 'default',
  theme: 'zinc',
  radius: 0.5,
  sonnerPosition: 'bottom-right',
  sonnerExpand: false,
  // backendProvider: 'nextjs-auth',
})

export function useConfig() {
  return useAtom(configAtom)
}
