'use client'

import { SupabaseQueryHandler } from '@/registry/default/blocks/infinite-query-hook/hooks/use-infinite-query'
import { Database } from '@/registry/default/fixtures/database.types'
import { InfiniteList } from './infinite-list-demo'

type Channel = Database['public']['Tables']['channels']['Row']

// Define how each item should be rendered
const renderChannelItem = (channel: Channel) => {
  return (
    <div className="border-b py-3 px-4 hover:bg-muted flex items-center justify-between">
      <div>
        <span className="font-medium text-sm text-foreground">
          {channel.slug} (ID: {channel.id})
        </span>
        <div className="text-sm text-foreground-light">
          {new Date(channel.inserted_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

// Define a filter to only show logs with log_level = 'info'
const orderByCreateAt: SupabaseQueryHandler<'channels'> = (query) => {
  return query.order('created_at', { ascending: false })
}

const InfiniteListDemo = () => {
  return (
    <div className="bg-surface-100 h-[600px]">
      <InfiniteList
        tableName="channels"
        renderItem={renderChannelItem}
        pageSize={15}
        trailingQuery={orderByCreateAt}
      />
    </div>
  )
}

export default InfiniteListDemo
