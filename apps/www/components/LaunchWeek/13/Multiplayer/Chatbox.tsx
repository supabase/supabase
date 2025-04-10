// import { IconLoader } from '@supabase/ui'
import { FC, RefObject } from 'react'
import { Message } from './types'

interface Props {
  messages: Message[]
  chatboxRef: RefObject<any>
  messagesInTransit: string[]
  areMessagesFetched: boolean
}

const Chatbox: FC<Props> = ({ messages, chatboxRef, messagesInTransit, areMessagesFetched }) => {
  return (
    <div className="flex flex-col rounded-md break-all">
      <div
        className="space-y-1 py-2 px-4 w-[400px]"
        style={{ backgroundColor: 'rgba(0, 207, 144, 0.05)' }}
      >
        {!areMessagesFetched ? (
          <div className="flex items-center space-x-2">
            {/* <IconLoader className="animate-spin text-scale-1200" size={14} /> */}
            <p className="text-sm text-scale-1100">Loading messages</p>
          </div>
        ) : messages.length === 0 && messagesInTransit.length === 0 ? (
          <div className="text-scale-1200 text-sm opacity-75">
            <span>Type anything to start chatting 🥳</span>
          </div>
        ) : (
          <div />
        )}
        {messages.map((message) => (
          <p key={message.id} className="text-scale-1200 text-sm whitespace-pre-line">
            {message.message}
          </p>
        ))}
        {messagesInTransit.map((message, idx: number) => (
          <p key={`transit-${idx}`} className="text-sm text-scale-1100">
            {message}
          </p>
        ))}
        {/* <div ref={chatboxRef} className="!mt-0" /> */}
      </div>
    </div>
  )
}

export default Chatbox
