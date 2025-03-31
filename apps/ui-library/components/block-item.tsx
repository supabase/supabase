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

export const BlockItemPreview = ({ title, src }: { title: string; src: string }) => {
  return (
    <div className="flex items-center justify-center relative border rounded-lg">
      <iframe src={src} className="w-full h-[600px] border-0 rounded-md" title={title} />
    </div>
  )
}
