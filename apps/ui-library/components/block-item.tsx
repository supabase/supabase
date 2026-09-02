'use client'

import dynamic from 'next/dynamic'

import { BlockInstallPromptButton } from '@/components/block-install-prompt-button'
import { OpenInV0Button } from '@/components/open-in-v0-button'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
}

export const BlockItem = ({ name }: BlockItemProps) => {
  const framework = name.includes('vue') || name.includes('nuxtjs') ? 'vue' : 'react'

  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} />
      <div className="mt-4 flex items-center gap-2">
        <BlockInstallPromptButton name={name} framework={framework} />
        <OpenInV0Button name={name} className="w-fit shrink-0" />
      </div>
    </div>
  )
}
