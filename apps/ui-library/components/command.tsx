import { CommandCopyButton } from './command-copy-button'

interface CommandCopyProps {
  name: string
}

export function Command({ name }: CommandCopyProps) {
  const command = `npx shadcn@latest add ${
    process.env.VERCEL_TARGET_ENV === 'production'
      ? `https://supabase.com`
      : process.env.VERCEL_TARGET_ENV === 'preview'
        ? `https://${process.env.VERCEL_PROJECT_PREVIEW_URL}`
        : 'http://localhost:3004'
  }${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`

  return (
    <>
      <div className="relative flex items-center rounded-lg bg-black px-4 py-3">
        <div className="flex-1 font-mono text-sm text-white">
          <span className="mr-2 text-[#888]">$</span>
          {command}
        </div>
        <CommandCopyButton command={command} />
      </div>
    </>
  )
}
