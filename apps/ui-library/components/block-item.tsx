import { Command } from '@/components/command'
import { OpenInV0Button } from '@/components/open-in-v0-button'

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
