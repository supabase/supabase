'use client'

import { useConversationsQuery } from '@/data/conversations-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Button, IconChevronRight, Input } from 'ui'

export default function Profile() {
  const MOCK_PROFILE = {
    name: 'J-Dog',
    username: 'joshenlim',
    email: 'joshen@supabase.io',
    avatar: 'https://i.pinimg.com/564x/d1/0d/89/d10d890537309f146f92f9af9d70cf83.jpg',
  }

  const { data, isLoading, isSuccess } = useConversationsQuery({ userId: '' })
  const conversations = data ?? []

  return (
    <div className="grid grid-cols-4 gap-x-8 py-12">
      <div className="col-span-1 flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4">
          <div
            className="w-14 h-14 rounded-full border bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: `url('${MOCK_PROFILE.avatar}')` }}
          />
          <div className="flex flex-col">
            <p className="text-xl">{MOCK_PROFILE.name}</p>
            <p className="text-foreground-light">@{MOCK_PROFILE.username}</p>
          </div>
        </div>

        {/* [Joshen] If we want some form action here */}
        <div className="flex flex-col gap-y-2">
          <Input size="tiny" label="Name" value={MOCK_PROFILE.name} />
          <Input size="tiny" label="Username" value={MOCK_PROFILE.username} />
          <Input size="tiny" label="Email" value={MOCK_PROFILE.email} />
        </div>

        <div className="flex items-center justify-end gap-x-2">
          <Button type="default">Cancel</Button>
          <Button type="primary">Save changes</Button>
        </div>
      </div>

      <div className="col-span-3 flex flex-col gap-y-4">
        <p>Past conversations</p>

        <div className="w-full h-px border-t" />

        <div className="flex flex-col gap-y-3">
          {isLoading && (
            <div className="flex flex-col gap-y-3">
              <div className="rounded w-full shimmering-loader py-7" />
              <div className="rounded w-full shimmering-loader py-7" />
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="border rounded py-6 flex flex-col items-center justify-center gap-y-2">
              <p className="text-sm text-foreground-light">No conversations created yet</p>
              <Button type="default">
                <Link href="/new">Start a conversation</Link>
              </Button>
            </div>
          )}

          {isSuccess &&
            conversations.map((conversation) => {
              const hoursFromNow = dayjs().diff(dayjs(conversation.updatedAt), 'hours')
              const formattedTimeFromNow = dayjs(conversation.updatedAt).fromNow()
              const formattedUpdatedAt = dayjs(conversation.updatedAt).format('DD MMM YYYY, HH:mm')

              return (
                <Link
                  key={conversation.id}
                  href={`/${conversation.threadId}/${conversation.runId}`}
                >
                  <div className="group flex items-center justify-between border rounded w-full px-4 py-2 transition bg-surface-100 hover:bg-surface-200">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-sm">{conversation.name}</p>
                      <p className="text-xs text-foreground-light">
                        Last updated at{' '}
                        {hoursFromNow > 6 ? `on ${formattedUpdatedAt}` : formattedTimeFromNow}
                      </p>
                    </div>
                    <Button
                      type="text"
                      icon={<IconChevronRight size={16} strokeWidth={2} />}
                      className="transition opacity-0 group-hover:opacity-100 px-1"
                    />
                  </div>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
