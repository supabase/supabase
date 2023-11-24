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
import { ThreadType } from './Threads'

const Thread = ({
  thread,
  handleThreadActions,
  onSelectEdit,
  onSelectDelete,
}: {
  thread: ThreadType
  handleThreadActions: (formData: FormData) => void
  onSelectEdit: () => void
  onSelectDelete: () => void
}) => {
  const formattedTimeAgo = timeAgo(thread.created_at)

  //[Joshen] Just FYI Terry sorry i had to peel out your form component here which handled the delete
  // Ideal UX for delete is to have a confirmation modal, and edit to be in a modal too so need client
  // <form action={handleThreadActions} className="flex gap-2 items-center">
  //   <input type="hidden" name="threadID" value={thread.thread_id} />
  // </form>

  return (
    <div
      key={thread.id}
      className="group flex items-center justify-between border rounded w-full px-4 py-2 transition bg-surface-100 hover:bg-surface-200"
    >
      <div className="flex flex-col gap-y-1">
        <Link className="text-sm hover:underline" href={`/${thread.thread_id}/${thread.run_id}`}>
          {thread.thread_title}
        </Link>
        <p className="text-xs text-foreground-light">Last updated {formattedTimeAgo}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button type="text" icon={<IconMoreVertical />} className="px-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32" align="center">
          <DropdownMenuItem className="space-x-2" onClick={onSelectEdit}>
            <IconEdit2 size={14} />
            <p>Edit name</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="space-x-2" onClick={onSelectDelete}>
            <IconTrash2 size={14} />
            <p>Delete thread</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Thread
