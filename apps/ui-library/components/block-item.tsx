import { Command } from '@/components/command'
import { OpenInV0Button } from '@/components/open-in-v0-button'

interface BlockItemProps {
  name: string
  title: string
  description: string
  src: string
}

export const BlockItem = ({ name, description }: BlockItemProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 relative">
      <Command name={name} />
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground sm:pl-3">{description}</h2>
        <OpenInV0Button name={name} className="w-fit" />
      </div>
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
