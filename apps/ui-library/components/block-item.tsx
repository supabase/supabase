'use client'

import { OpenInV0Button } from '@/components/open-in-v0-button'

import dynamic from 'next/dynamic'

//The dynamic import is to prevent the command component from being rendered on the server and cause hydration errors
const Command = dynamic(() => import('./command').then((mod) => mod.Command), { ssr: false })

interface BlockItemProps {
  name: string
}

export const BlockItem = ({ name }: BlockItemProps) => {
  return (
    <div className="mt-4">
      <Command name={name} highlight />
      <OpenInV0Button name={name} className="w-fit shrink-0 mt-4" />
    </div>
  )
}
