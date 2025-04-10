import { Button } from 'ui'
import { Plug, GitBranch, ChevronsUpDown, Pointer } from 'lucide-react'

export const ConnectionStringMoved = () => {
  return (
    <div className="w-full flex flex-col xl:flex-row border py-10 pl-10 rounded-md">
      <div className="flex flex-col gap-0 z-[2]">
        <p className="text-sm text-foreground">Connection string has moved</p>
        <p className="text-sm text-foreground-lighter">
          You can find Project connect details by clicking 'Connect' in the top bar
        </p>
      </div>
      <div className="relative grow flex flex-col -space-y-px">
        <div className="w-full h-3">
          <div className="bg-gradient-to-t from-background-surface-300 via-[25%] to-background-200 to-[100%] h-full w-full" />
        </div>
        <div className="flex justify-end relative">
          <div className="bg-dash-sidebar border-b border-t border-t-border-muted py-2 px-10 flex gap-3 relative overflow-hidden">
            <Button
              type="text"
              size="tiny"
              className="rounded-full pointer-events-none opacity-50"
              iconRight={<ChevronsUpDown size={12} strokeWidth={1.5} />}
            >
              Project name
            </Button>
            <Button
              type="default"
              size="tiny"
              className="rounded-full pointer-events-none ring-1 ring-foreground-muted/20"
              icon={<Plug size={12} className="rotate-90" />}
            >
              Connect
            </Button>
            <Button
              type="text"
              size="tiny"
              className="rounded-full pointer-events-none -mr-20 opacity-50"
              icon={<GitBranch size={12} />}
            >
              Enable Branching
            </Button>
          </div>
          <Pointer
            className=" absolute top-7 right-[110px] text-foreground-light fill-background"
            strokeWidth={1}
          />
        </div>
        <div className="absolute -inset-2 bg-gradient-to-l from-transparent via-background-200 via-[95%] to-background-200 to-[100%] z-[1]" />
      </div>
    </div>
  )
}
