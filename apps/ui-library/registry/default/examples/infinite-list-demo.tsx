'use client'

import { InfiniteList } from '@/registry/default/blocks/infinite-list/components/infinite-list'

console.log('hello')

// Example Task data structure (Adapt to your actual data)
export type Task = {
  id: number
  title: string
  status: 'todo' | 'in progress' | 'done' | 'canceled'
  label: 'bug' | 'feature' | 'documentation'
  priority: 'low' | 'medium' | 'high'
  created_at: string // Assuming ISO string format from Supabase
}

// IMPORTANT: Replace 'your_table_name' with the actual name of your Supabase table
const YOUR_SUPABASE_TABLE_NAME = 'tasks' // <<<--- CHANGE THIS

const InfiniteListDemo = () => {
  // Define how each item should be rendered
  const renderTaskItem = (task: Task) => {
    return (
      <div className="border p-3 rounded-md hover:bg-muted transition-colors">
        <div className="flex justify-between items-center">
          <span className="font-medium">
            {task.title} (ID: {task.id})
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {task.priority}
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Status: {task.status} | Label: {task.label} | Created:{' '}
          {new Date(task.created_at).toLocaleDateString()}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Infinite Scroll Tasks List</h2>
      {/* 
        Ensure your Supabase instance has a table named `YOUR_SUPABASE_TABLE_NAME` 
        with columns matching the 'Task' type.
      */}
      <InfiniteList<Task>
        tableName={YOUR_SUPABASE_TABLE_NAME}
        renderItem={renderTaskItem}
        pageSize={15}
      />
    </div>
  )
}

export default InfiniteListDemo
