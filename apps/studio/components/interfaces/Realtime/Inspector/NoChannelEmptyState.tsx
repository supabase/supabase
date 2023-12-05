import { PlayCircle } from 'lucide-react'
import { Button, IconExternalLink } from 'ui'

const NoChannelEmptyState = () => {
  return (
    <div className="border bg-background border-border rounded-md justify-start items-center flex flex-col w-10/12 relative">
      <div className="w-full absolute top-20 border-t" />
      {/* [Joshen] Opting to code this in instead of an SVG as imo a UI-based image will get outdated very quickly */}
      <div className="pt-8 pb-4 px-10 w-full flex flex-col gap-y-2 z-10">
        <div className="flex">
          <div className="text-xs bg-surface-200 py-1 px-2 rounded rounded-r-none border border-r-0">
            <p>Join a channel</p>
          </div>
          <div className="text-xs bg-brand-button py-1 px-2 rounded rounded-l-none border border-brand flex items-center gap-x-2">
            <PlayCircle size={16} />
            <p>Start listening</p>
          </div>
        </div>
        <div className="bg-surface-100 border w-full p-4 rounded-md flex flex-col gap-y-2">
          <p className="text-xs">Name of channel</p>
          <div className="flex w-full bg-surface-100 border rounded-md">
            <div className="w-full text-xs text-foreground-light py-1.5 px-2 cursor-default">
              Enter a channel name
            </div>
            <div className="w-[140px] flex items-center justify-center text-xs bg-surface-300 py-1.5 px-2 border-l cursor-default">
              Join channel
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b rounded-t-md">
        <div className="grow flex-col flex gap-y-1">
          <p className="text-foreground">Join a channel to start listening to messages</p>
          <p className="text-foreground-lighter text-xs">
            Channels are the building blocks of realtime where clients can bi-directionally send and
            receive messages in.
          </p>
        </div>
      </div>
      <div className="w-full px-5 py-4 items-center gap-4 inline-flex rounded-b-md">
        <div className="grow flex-col flex">
          <p className="text-foreground">Not sure what to do?</p>
          <p className="text-foreground-lighter text-xs">Browse our documentation</p>
        </div>
        <Button type="default" iconRight={<IconExternalLink />}>
          <a href="https://supabase.com/docs/guides/realtime" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </Button>
      </div>
    </div>
  )
}

export default NoChannelEmptyState
