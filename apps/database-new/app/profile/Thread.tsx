'use client'

import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import {
  Button,
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
import { useState } from 'react'

const Thread = ({ thread }: { thread: ThreadType }) => {
  const formattedTimeAgo = timeAgo(thread.created_at)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div
        key={thread.id}
        className="group flex items-center justify-between border rounded w-full px-4 py-2 transition bg-surface-100 hover:bg-surface-200"
      >
        <div className="flex flex-col gap-y-1">
          <Link className="text-sm hover:underline" href={`/${thread.thread_id}/${thread.run_id}`}>
            {thread.thread_title}
          </Link>
          <span className="text-xs text-foreground-light">Last updated {formattedTimeAgo}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" icon={<IconMoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32" align="end">
            <DropdownMenuItem className="space-x-2" onClick={() => setEditOpen(true)}>
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

      <ConfirmDeleteThreadModal
        key={`${thread.id}-delete-dialog`}
        thread={thread}
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
      <EditThreadModal
        key={`${thread.id}-edit-dialog`}
        thread={thread}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}

export default Thread
