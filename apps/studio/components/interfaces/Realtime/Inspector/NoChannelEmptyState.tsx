import { DocsButton } from 'components/ui/DocsButton'
import { cn } from 'ui'

const NoChannelEmptyState = () => {
  return (
    <div className="border bg-studio border-border rounded-md justify-start items-center flex flex-col w-10/12 relative">
      <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b rounded-t-md">
        <div className="grow flex-col flex gap-y-1">
          <p className="text-foreground">Join a channel to start listening to messages</p>
          <p className="text-foreground-lighter text-xs">
            Channels are the building blocks of realtime where clients can bi-directionally send and
            receive messages in.
          </p>
        </div>
      </div>
      <div className={cn('w-full px-5 py-4 items-center gap-4 inline-flex')}>
        <div className="grow flex-col flex">
          <p className="text-foreground">Not sure what to do?</p>
          <p className="text-foreground-lighter text-xs">Browse our documentation</p>
        </div>
        <DocsButton href="https://supabase.com/docs/guides/realtime" />
      </div>
    </div>
  )
}

export default NoChannelEmptyState
