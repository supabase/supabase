'use client'

import { InfiniteList } from '@/registry/default/blocks/infinite-list/components/infinite-list'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'

// Example Task data structure (Adapt to your actual data)
export type Log = {
  id: number
  log_message: string
  log_level: string
  created_at: string // Assuming ISO string format from Supabase
}

// IMPORTANT: Replace 'your_table_name' with the actual name of your Supabase table
const YOUR_SUPABASE_TABLE_NAME = 'logging_data' // <<<--- CHANGE THIS

const InfiniteListDemo = () => {
  // Define how each item should be rendered
  const renderLogItem = (log: Log) => {
    return (
      <div className="border-b py-3 px-4 hover:bg-muted flex items-center justify-between">
        <div>
          <span className="font-medium text-sm text-foreground">
            {log.log_message} (ID: {log.id})
          </span>
          <div className="text-sm text-foreground-light">
            {new Date(log.created_at).toLocaleDateString()}
          </div>
        </div>
        <span className="text-xs text-foreground-light rounded-lg py-2 px-3 bg-muted">
          {log.log_level}
        </span>
      </div>
    )
  }

  // Define a filter to only show logs with log_level = 'info'
  const filterLogsToInfo = (query: PostgrestFilterBuilder<any, any, any>) => {
    return query.eq('log_level', 'INFO')
  }

  return (
    <div className="bg-surface-100 h-[600px]">
      {/* 
        Ensure your Supabase instance has a table named `YOUR_SUPABASE_TABLE_NAME` 
        with columns matching the 'Log' type.
      */}
      <InfiniteList<Log>
        tableName={YOUR_SUPABASE_TABLE_NAME}
        renderItem={renderLogItem}
        pageSize={15}
        filterBuilder={filterLogsToInfo}
      />
    </div>
  )
}

export default InfiniteListDemo
