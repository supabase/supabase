import { Command } from '@/components/command'
import { OpenInV0Button } from '@/components/open-in-v0-button'

interface BlockItemProps {
  name: string
  title: string
  description: string
  src: string
}

export const BlockItem = ({ name, description }: BlockItemProps) => {
  const command = `npx shadcn@latest add ${
    process.env.VERCEL_TARGET_ENV === 'production'
      ? `https://supabase.com`
      : process.env.VERCEL_TARGET_ENV === 'preview'
        ? `https://${process.env.VERCEL_PROJECT_PREVIEW_URL}`
        : 'http://localhost:3004'
  }${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`

  return (
    <div className="mt-4">
      <Command url={command} highlight />
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
