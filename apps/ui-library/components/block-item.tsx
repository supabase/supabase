'use client'

import dynamic from 'next/dynamic'

import type { ShadcnFramework } from '@/lib/install-command'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
  /**
   * Declares whether v0 can open this registry item. The page header renders the
   * button, so this attribute is read from the MDX source at build time
   * (see `getV0RegistryName` in velite.config.js) rather than used here.
   */
  showOpenInV0?: boolean
  framework?: ShadcnFramework
}

export const BlockItem = ({ name, framework = 'react' }: BlockItemProps) => {
  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} />
    </div>
  )
}
