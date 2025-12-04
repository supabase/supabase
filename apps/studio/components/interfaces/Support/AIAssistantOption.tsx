import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { AiIconAnimation, Button } from 'ui'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

interface AIAssistantOptionProps {
  projectRef?: string | null
  organizationSlug?: string | null
}

export const AIAssistantOption = ({ projectRef, organizationSlug }: AIAssistantOptionProps) => {
  const { mutate: sendEvent } = useSendEventMutation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const onAiAssistantClicked = useCallback(() => {
    sendEvent({
      action: 'ai_assistant_in_support_form_clicked',
      groups: {
        project: projectRef === null || projectRef === NO_PROJECT_MARKER ? undefined : projectRef,
        organization:
          organizationSlug === null || organizationSlug === NO_ORG_MARKER
            ? undefined
            : organizationSlug,
      },
    })
  }, [projectRef, organizationSlug, sendEvent])

  // If no specific project selected, use the wildcard route
  const aiLink = `/project/${projectRef !== NO_PROJECT_MARKER ? projectRef : '_'}?aiAssistantPanelOpen=true&slug=${organizationSlug}`

  if (!organizationSlug || organizationSlug === NO_ORG_MARKER) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="w-full overflow-hidden border rounded-md relative bg-200"
        >
          <div className="flex items-center p-6">
            <div className="flex flex-col gap-3 z-[2] flex-shrink-0 w-full">
              <div>
                <h5 className="text-sm font-medium text-foreground">Try Supabase Assistant</h5>
                <p className="text-sm text-foreground-lighter">
                  Ask our AI assistant to help you with your support issue.
                </p>
              </div>
              <div>
                <Link href={aiLink} onClick={onAiAssistantClicked}>
                  <Button size="tiny" type="default" icon={<AiIconAnimation size={14} />}>
                    Ask the Assistant
                  </Button>
                </Link>
              </div>
            </div>
            {/* Decorative background */}
            <div className="absolute z-[1] scale-75 -right-40 md:-right-24 -top-6 md:top-0">
              <div className="relative grow flex flex-col gap-3 w-[400px]">
                <div className="flex items-start gap-3 pl-12">
                  <div className="w-8 h-8 rounded-full bg-background-surface-300 flex items-center justify-center">
                    <MessageSquare size={16} className="text-foreground-lighter" />
                  </div>
                  <div className="flex-1 bg-background-surface-200 rounded-lg p-4 max-w-[280px]">
                    <p className="text-sm text-foreground-lighter">
                      Hi! I'm your AI assistant. How can I help you today?
                    </p>
                  </div>
                </div>
                <div className="flex items-start justify-end gap-3 pr-10">
                  <div className="bg-background-surface-200 rounded-lg p-4 max-w-[280px]">
                    <p className="text-sm text-foreground-lighter">
                      I can help you with database queries, API endpoints, or any other technical
                      questions you might have.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-l from-transparent via-background-200 via-[90%] to-background-200 to-[100%] z-[1]" />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
