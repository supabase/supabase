import * as Popover from '@radix-ui/react-popover'
import { motion } from 'framer-motion'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, OPT_IN_TAGS } from 'lib/constants'
import { Button, IconInfo } from 'ui'

export interface AISchemaSuggestionPopoverProps {
  delay?: number
  onClickSettings?: () => void
}

const AISchemaSuggestionPopover = ({
  children,
  delay = 300,
  onClickSettings,
}: PropsWithChildren<AISchemaSuggestionPopoverProps>) => {
  const selectedOrganization = useSelectedOrganization()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery('supabase_sql-editor-ai-schema', true)
  const [isDelayComplete, setIsDelayComplete] = useState(false)
  const [aiQueryCount] = useLocalStorageQuery('supabase_sql-editor-ai-query-count', 0)

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const [isSchemaSuggestionDismissed, setIsSchemaSuggestionDismissed] = useLocalStorageQuery(
    'supabase_sql-editor-ai-schema-suggestion-dismissed',
    false
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsDelayComplete(true)
    }, delay)

    return () => window.clearTimeout(timeout)
  })

  return (
    <Popover.Root
      open={
        isDelayComplete &&
        !includeSchemaMetadata &&
        aiQueryCount >= 3 &&
        !isSchemaSuggestionDismissed
      }
    >
      <Popover.Anchor asChild>{children}</Popover.Anchor>

      <Popover.Portal>
        <Popover.Content side="bottom" sideOffset={5}>
          <motion.div
            variants={{
              visible: {
                opacity: 1,
                y: 0,
              },
              hidden: {
                opacity: 0,
                y: -10,
              },
            }}
            initial="hidden"
            animate="visible"
          >
            <Popover.Arrow className="fill-background-surface-300" />
            <div className="flex flex-col gap-2 border border-default rounded-md p-4 bg-surface-100 shadow-xl">
              <div className="flex flex-row items-center gap-4 max-w-md">
                <IconInfo className="w-6 h-6" />
                <p className="text-sm">
                  Generate more relevant queries by including database metadata in your requests.
                </p>
              </div>
              <div className="flex flex-row gap-2 justify-end">
                <Button
                  type="default"
                  onClick={() => {
                    setIsSchemaSuggestionDismissed(true)
                  }}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => {
                    setIsSchemaSuggestionDismissed(true)
                    onClickSettings?.()
                  }}
                >
                  Open settings
                </Button>
              </div>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default AISchemaSuggestionPopover
