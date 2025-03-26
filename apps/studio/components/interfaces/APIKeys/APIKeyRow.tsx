import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { InputVariants } from '@ui/components/shadcn/ui/input'
import { Eye, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useAPIKeyIdQuery } from 'data/api-keys/[id]/api-key-id-query'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { AnimatePresence, motion } from 'framer-motion'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  cn,
} from 'ui'
import { APIKeyDeleteDialog } from './APIKeyDeleteDialog'

export const APIKeyRow = ({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) => {
  const MotionTableRow = motion(TableRow)

  return (
    <MotionTableRow
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 50,
        mass: 1,
      }}
    >
      <TableCell className="py-2">{apiKey.description || '/'}</TableCell>
      <TableCell className="py-2">
        <div className="flex flex-row gap-2">
          <Input apiKey={apiKey} />
        </div>
      </TableCell>

      <TableCell className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-1 focus-visible:outline-none" asChild>
            <Button
              type="text"
              size="tiny"
              icon={
                <MoreVertical size="14" className="text-foreground-light hover:text-foreground" />
              }
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <APIKeyDeleteDialog apiKey={apiKey} />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </MotionTableRow>
  )
}

function Input({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const [show, setShowState] = useState(false)

  // to do
  // const canReadAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')

  const isSecret = apiKey.type === 'secret'

  const {
    data,
    isLoading: isLoadingApiKey,
    error,
    refetch: refetchApiKey,
  } = useAPIKeyIdQuery(
    {
      projectRef,
      id: apiKey.id as string,
      reveal: true,
    },
    {
      enabled: show,
      staleTime: 0, // Data is considered stale immediately
      cacheTime: 0, // Cache is cleared immediately after query becomes stale
    }
  )

  async function onSubmitShow() {
    setShowState(true)
    // Set a timeout to invalidate the cache after a certain amount of time
    setTimeout(() => {
      setShowState(false)
      queryClient.removeQueries({
        queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
        exact: true,
      })
    }, 10000) // Destroy query after 10 seconds
  }

  async function onCopy() {
    // if ID already exists from a reveal action, return that
    if (data?.api_key) return data?.api_key

    try {
      // fetch ID and then destroy query immediately
      const result = await refetchApiKey()
      queryClient.removeQueries({
        queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
        exact: true,
      })

      if (result.isSuccess) return result.data.api_key

      if (error) {
        toast.error('Failed to copy secret API key')
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }

    // Fallback to the masked version
    return apiKey.api_key
  }

  return (
    <>
      <div
        className={cn(
          InputVariants({ size: 'tiny' }),
          'flex-1 grow gap-0 font-mono rounded-full max-w-60 overflow-hidden',
          show ? 'ring-1 ring-foreground-lighter ring-opacity-50' : 'ring-0 ring-opacity-0',
          'transition-all'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={show ? 'shown' : 'hidden'}
            initial={{ opacity: 0, y: show ? 16 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: show ? 16 : -16 }}
            transition={{
              duration: 0.12,
              y: { type: 'spring', stiffness: 2450, damping: 55 },
            }}
            className="truncate"
          >
            {show ? data?.api_key : apiKey?.api_key}
          </motion.span>
        </AnimatePresence>
      </div>
      {isSecret && (
        <AnimatePresence>
          {!show && (
            <motion.div
              initial={{ opacity: 0, scale: 1, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 1, width: 0 }}
              transition={{ duration: 0.12 }}
              style={{ overflow: 'hidden' }}
            >
              <Button
                type="outline"
                className="rounded-full px-2"
                icon={<Eye strokeWidth={2} />}
                onClick={onSubmitShow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      <CopyButton type="default" asyncText={onCopy} iconOnly className="rounded-full px-2" />
    </>
  )
}
