'use client'

import dynamic from 'next/dynamic'

import type { ShadcnFramework } from '@/lib/install-command'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
  framework?: ShadcnFramework
}

export const BlockItem = ({ name, framework = 'react' }: BlockItemProps) => {
  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} />
    </div>
  )
}
