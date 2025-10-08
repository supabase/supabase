import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Columns3, Edit2, MoreVertical, Trash, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { DeleteBucketModal } from 'components/interfaces/Storage/DeleteBucketModal'
import { EditBucketModal } from 'components/interfaces/Storage/EditBucketModal'
import { EmptyBucketModal } from 'components/interfaces/Storage/EmptyBucketModal'
import type { Bucket } from 'data/storage/buckets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'

export interface BucketRowProps {
  bucket: Bucket
  projectRef?: string
  isSelected: boolean
}

export const BucketRow = ({ bucket, projectRef = '', isSelected = false }: BucketRowProps) => {
  const { can: canUpdateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const [modal, setModal] = useState<string | null>(null)
  const onClose = () => setModal(null)

  return (
    <div
      key={bucket.id}
      className={cn(
        'group flex items-center justify-between rounded-md',
        isSelected && 'text-foreground bg-surface-100'
      )}
    >
      {/* Even though we trim whitespaces from bucket names, there may be some existing buckets with trailing whitespaces. */}
      <Link
        href={`/project/${projectRef}/storage/buckets/${encodeURIComponent(bucket.id)}`}
        className="py-1 pl-3 pr-1 flex-grow min-w-0"
      >
        <div className="flex items-center justify-between space-x-2 truncate w-full">
          <p
            className={cn(
              'text-sm group-hover:text-foreground transition truncate',
              isSelected ? 'text-foreground' : 'text-foreground-light'
            )}
            title={bucket.name}
          >
            {bucket.name}
          </p>
          {bucket.public && <Badge variant="warning">Public</Badge>}
          {bucket.type === 'ANALYTICS' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Columns3 className="text-foreground-lighter" size="20" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Analytics bucket</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </Link>
      {canUpdateBuckets && isSelected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" icon={<MoreVertical />} className="mr-1 h-6 w-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            {bucket.type !== 'ANALYTICS' && (
              <>
                <DropdownMenuItem
                  key="toggle-private"
                  className="space-x-2"
                  onClick={() => setModal(`edit`)}
                >
                  <Edit2 size={14} />
                  <p>Edit bucket</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  key="empty-bucket"
                  className="space-x-2"
                  onClick={() => setModal(`empty`)}
                >
                  <XCircle size={14} />
                  <p>Empty bucket</p>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              key="delete-bucket"
              className="space-x-2"
              onClick={() => setModal(`delete`)}
            >
              <Trash size={14} />
              <p>Delete bucket</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="min-w-6 mr-1" />
      )}

      <EditBucketModal visible={modal === `edit`} bucket={bucket} onClose={onClose} />
      <EmptyBucketModal visible={modal === `empty`} bucket={bucket} onClose={onClose} />
      <DeleteBucketModal visible={modal === `delete`} bucket={bucket} onClose={onClose} />
    </div>
  )
}
