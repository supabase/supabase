'use client'

import dynamic from 'next/dynamic'

import { OpenInV0Button } from '@/components/open-in-v0-button'
import type { ShadcnFramework } from '@/lib/install-command'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
  showOpenInV0?: boolean
  framework?: ShadcnFramework
}

export const BlockItem = ({ name, showOpenInV0 = true, framework = 'react' }: BlockItemProps) => {
  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} />
      {showOpenInV0 && <OpenInV0Button name={name} className="w-fit shrink-0 mt-4" />}
    </div>
  )
}
