'use client'

import dynamic from 'next/dynamic'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
  installArgs?: string
}

export const BlockItem = ({ name, installArgs }: BlockItemProps) => {
  const framework = name.includes('vue') || name.includes('nuxtjs') ? 'vue' : 'react'

  return (
    <div className="mt-4">
      <Command name={name} highlight framework={framework} installArgs={installArgs} />
    </div>
  )
}
