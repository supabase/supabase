import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useAPIKeyIdQuery } from 'data/api-keys/[id]/api-key-id-query'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { apiKeysKeys } from 'data/api-keys/keys'
import { Button, cn } from 'ui'

export function ApiKeyPill({
  apiKey,
}: {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}) {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const [show, setShowState] = useState(false)

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

  // Auto-hide timer for the API key
  useEffect(() => {
    if (show && data?.api_key) {
      const timer = setTimeout(() => {
        setShowState(false)
        queryClient.removeQueries({
          queryKey: apiKeysKeys.single(projectRef, apiKey.id as string),
          exact: true,
        })
      }, 10000) // Hide after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [show, data?.api_key, projectRef, queryClient])

  async function onSubmitShow() {
    setShowState(true)
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
      <AnimatePresence mode="wait" initial={false}>
        <div
          className={cn(
            InputVariants({ size: 'tiny' }),
            'flex-1 grow gap-0 font-mono rounded-full overflow-hidden',
            show ? 'ring-1 ring-foreground-lighter ring-opacity-50' : 'ring-0 ring-opacity-0',
            'transition-all',
            'max-w-[340px]',
            'cursor-text',
            'relative'
          )}
          style={{ userSelect: 'all' }}
        >
          <span>{apiKey?.api_key.slice(0, 15)}</span>
          <motion.span
            key={show ? 'shown' : 'hidden'}
            initial={{ opacity: 0, y: show ? 16 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: show ? 16 : -16 }}
            transition={{
              duration: 0.1,
              y: { type: 'spring', stiffness: 1000, damping: 55 },
            }}
            className="truncate"
          >
            {show && data?.api_key ? data?.api_key.slice(15) : '••••••••••••••••'}
          </motion.span>
        </div>
      </AnimatePresence>
      {isSecret && (
        <AnimatePresence initial={false}>
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
