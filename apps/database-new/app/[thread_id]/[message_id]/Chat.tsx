import { Suspense } from 'react'

import { cn } from '@ui/lib/utils/cn'

import { ClientMessages } from './ClientMessages'
import { getMessages } from './getMessages'

async function Chat({ params }: { params: { thread_id: string } }) {
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
        <Suspense fallback={<p>hello loading</p>}>
          <ServerMessages threadId={params.thread_id} />
        </Suspense>
      </div>
    </div>
  )
}

const ServerMessages = async ({ threadId }: { threadId: string }) => {
  const { data: messages, error } = await getMessages(threadId)

  if (error) {
    return <>Error happened</>
  }

  return <ClientMessages threadId={threadId} messages={messages} />
}

export { Chat }
