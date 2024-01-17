import { Suspense } from 'react'
import { ScrollArea } from 'ui'

import { cn } from '@ui/lib/utils/cn'

import { Messages } from './Messages'
import { ChatInput } from './ChatInput'
import { BottomMarker } from './BottomMarker'

async function Chat({ params }: { params: { threadId: string; runId: string } }) {
  return (
    <div
      className={cn(
        'bg',
        'h-full',
        'border-t xl:border-t-0 xl:border-r relative',
        'flex flex-col h-full border-r',
        'w-full xl:w-[400px] 2xl:w-[500px]'
      )}
    >
      <div className="flex flex-col grow items-between">
        <ScrollArea className="grow h-px">
          <div className="flex flex-col py-2 xl:py-6">
            <Suspense fallback={<p> loading</p>}>
              <Messages params={params} />
            </Suspense>
            <BottomMarker />
          </div>
        </ScrollArea>
        <ChatInput params={params} />
      </div>
    </div>
  )
}

export { Chat }
