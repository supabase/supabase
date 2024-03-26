'use client'

import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconEdit2,
  IconMoreVertical,
  IconTrash2,
} from 'ui'
import ConfirmDeleteThreadModal from './ConfirmDeleteThreadModal'
import EditThreadModal from './EditThreadModal'
import { ThreadType } from './Threads'

const Thread = ({ thread }: { thread: ThreadType }) => {
  const { created_at, thread_id, thread_title } = thread
  const formattedTimeAgo = timeAgo(created_at!)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div
        key={thread_id}
        className="group w-full flex flex-row items-center gap-6  border rounded pl-5 pr-2 transition bg-surface-100 hover:bg-surface-200 h-14"
      >
        <div className="flex flex-col grow overflow-hidden">
          <Link
            className="flex text-sm group-hover:underline truncate"
            href={`/${thread.thread_id}/${thread.message_id}`}
          >
            <span className="truncate">{thread_title}</span>
          </Link>
          <span className="text-xs text-foreground-lighter font-mono">
            Last updated {formattedTimeAgo}
          </span>
        </div>
        <div className="flex shrink">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-1 group">
                <IconMoreVertical size={14} className="text-light group-hover:text" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32" align="end">
              <DropdownMenuItem
                className="space-x-2"
                onClick={() => {
                  console.log('trying to edit thread')
                  setEditOpen(true)
                }}
              >
                <IconEdit2 size={14} />
                <p>Edit name</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={() => setDeleteOpen(true)}>
                <IconTrash2 size={14} />
                <p>Delete thread</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ConfirmDeleteThreadModal
        key={`${thread_id}-delete-dialog`}
        thread={thread}
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
      <EditThreadModal
        key={`${thread_id}-edit-dialog`}
        thread={thread}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}

export default Thread
