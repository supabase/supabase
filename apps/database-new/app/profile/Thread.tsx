'use client'

import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'
import {
  Badge,
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
import { ThreadType, ThreadViewType } from './Threads'
import { Lock, Unlock } from 'lucide-react'
import ThreadPrivacyModal from './ThreadPrivacyModal'

const Thread = ({ thread }: { thread: ThreadViewType }) => {
  const { created_at, thread_id, thread_title, is_public } = thread
  const formattedTimeAgo = timeAgo(created_at!)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <div
        key={thread_id}
        className="group w-full flex flex-row items-center gap-6  border rounded pl-5 pr-2 transition bg-surface-100 hover:bg-surface-200  py-4"
      >
        <div className="grid gap-1 grow overflow-hidden">
          <div className="flex items-center gap-3">
            <Link
              className="flex text-sm group-hover:underline truncate"
              href={`/${thread.thread_id}/${thread.message_id}`}
            >
              <span className="truncate">{thread_title}</span>
            </Link>
            <div className="text-sm"></div>
          </div>
          <div className="text-xs text-foreground-lighter font-mono flex items-center gap-2">
            Last updated {formattedTimeAgo} /
            <span className="flex items-center gap-2 uppercase">
              {is_public ? (
                <span className="flex items-center gap-2">
                  <Unlock size={12} className="text-blue-700" />
                  public
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock size={12} className="text-amber-700" />
                  private
                </span>
              )}
            </span>
          </div>
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
              <DropdownMenuItem
                className="space-x-2"
                onClick={() => {
                  console.log('trying to edit thread')
                  setPrivacyOpen(true)
                }}
              >
                {is_public ? (
                  <Lock size={14} strokeWidth={1} />
                ) : (
                  <Unlock size={14} strokeWidth={1} />
                )}
                <span>Edit visibility</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="space-x-2" onClick={() => setDeleteOpen(true)}>
                <IconTrash2 size={14} />
                <span>Delete thread</span>
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
      <ThreadPrivacyModal
        key={`${thread_id}-privacy-dialog`}
        thread={thread}
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
    </>
  )
}

export default Thread
