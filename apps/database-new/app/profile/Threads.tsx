'use client'
import { Database } from '@/types/supabase'
import EmptyState from './EmptyState'
import Thread from './Thread'
import { useState, useEffect } from 'react'
import ConfirmDeleteThreadModal from './ConfirmDeleteThreadModal'
import EditThreadModal from './EditThreadModal'

export type ThreadType = Database['public']['Tables']['threads']['Row']

interface ThreadsProps {
  threads: ThreadType[]
  handleThreadActions: (formData: FormData) => void
}

const Threads = ({ threads, handleThreadActions }: ThreadsProps) => {
  // To circumvent hydration errors, although not sure why its happening
  const [mounted, setMounted] = useState(false)
  const [selectedThreadToEdit, setSelectedThreadToEdit] = useState<ThreadType>()
  const [selectedThreadToDelete, setSelectedThreadToDelete] = useState<ThreadType>()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    mounted && (
      <>
        <div className="flex flex-col gap-y-3">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <Thread
                key={thread.id}
                thread={thread}
                handleThreadActions={handleThreadActions}
                onSelectEdit={() => setSelectedThreadToEdit(thread)}
                onSelectDelete={() => setSelectedThreadToDelete(thread)}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
        <ConfirmDeleteThreadModal
          thread={selectedThreadToDelete}
          onClose={() => setSelectedThreadToDelete(undefined)}
        />
        <EditThreadModal
          thread={selectedThreadToEdit}
          onClose={() => setSelectedThreadToEdit(undefined)}
        />
      </>
    )
  )
}

export default Threads
