import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { sortBy } from 'lodash'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import UserChat from './UserChat'

dayjs.extend(relativeTime)

async function Messages({ params }: { params: { thread_id: string } }) {
  const { thread_id } = params
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: userMessages, error } = await supabase
    .from('messages')
    .select()
    .eq('thread_id', thread_id)

  if (error) {
    console.log(error)
  }

  const messagesSorted = sortBy(userMessages, (m) => m.created_at)
  //console.log({ messagesSorted })

  return (
    <div className="flex flex-col py-2 xl:py-6">
      {messagesSorted.map((message, idx) => {
        const createdAtTimestamp = dayjs(message.created_at)
        const isLatest = Array.isArray(userMessages) && idx === userMessages.length - 1

        const hoursFromNow = dayjs().diff(createdAtTimestamp, 'hour')
        const formattedTimeFromNow = dayjs(createdAtTimestamp).fromNow()

        const formattedCreatedAt = dayjs(createdAtTimestamp).format('DD MMM YYYY, HH:mm')

        // const replyDuration =
        //   reply !== undefined ? reply.created_at - message.created_at : undefined

        const times = {
          hoursFromNow,
          formattedTimeFromNow,
          formattedCreatedAt,
          replyDuration: 5, // not sure what this is yet so hardcoding for now
        }

        return <UserChat key={message.id} message={message} isLatest={isLatest} times={times} />
      })}
    </div>
  )
}

export { Messages }
