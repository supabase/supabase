import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import CopyButton from '@/components/ui/CopyButton'

const INSTALL_OPTIONS = [
  { name: 'npm', command: 'npm install @supabase/server' },
  { name: 'pnpm', command: 'pnpm add @supabase/server' },
  { name: 'bun', command: 'bun add @supabase/server' },
  { name: 'Deno', command: 'import { withSupabase } from "npm:@supabase/server"' },
]

function ServerInstallContent() {
  return (
    <Tabs defaultValue="npm" className="overflow-hidden rounded-lg border">
      <TabsList className="gap-5 border-0 border-b bg-surface-75 px-4">
        {INSTALL_OPTIONS.map((option) => (
          <TabsTrigger
            key={option.name}
            value={option.name}
            className="px-0 py-2.5 text-xs data-[state=active]:bg-transparent"
          >
            {option.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {INSTALL_OPTIONS.map((option) => (
        <TabsContent
          key={option.name}
          value={option.name}
          className="m-0 data-[state=inactive]:hidden"
        >
          <div className="flex items-center gap-x-2 bg-surface-75 px-4 py-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-foreground-light">
              {option.command}
            </code>
            <CopyButton
              variant="default"
              size="tiny"
              iconOnly
              text={option.command}
              aria-label={`Copy ${option.name} command`}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default ServerInstallContent
