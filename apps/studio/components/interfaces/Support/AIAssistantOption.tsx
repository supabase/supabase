import { useProjectsQuery } from 'data/projects/projects-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from 'ui'

interface AIAssistantOptionProps {
  projectRef: string
  organizationSlug: string
  isCondensed?: boolean
}

export const AIAssistantOption = ({
  projectRef,
  organizationSlug,
  isCondensed = false,
}: AIAssistantOptionProps) => {
  const { data } = useProjectsQuery()
  const projects = data?.projects ?? []

  const { mutate: sendEvent } = useSendEventMutation()
  const [isVisible, setIsVisible] = useState(isCondensed ? true : false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const onAiAssistantClicked = useCallback(() => {
    sendEvent({
      action: 'ai_assistant_in_support_form_clicked',
      groups: {
        project: projectRef === 'no-project' ? undefined : projectRef,
        organization: organizationSlug,
      },
    })
  }, [projectRef, organizationSlug, sendEvent])

  if (!organizationSlug || organizationSlug === 'no-org') {
    return null
  }

  const getProjectRef = () => {
    if (projectRef !== 'no-project') {
      return projectRef
    }
    // If no specific project selected, use first project from the org
    const orgProjects = projects?.filter((p) => p.organization_slug === organizationSlug)
    return orgProjects?.[0]?.ref || '_'
  }

  const aiLink = `/project/${getProjectRef()}?aiAssistantPanelOpen=true`

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="w-full overflow-hidden border rounded-md relative"
        >
          <div className={`flex flex-col xl:flex-row ${isCondensed ? 'py-4 px-5' : 'py-8 px-10'}`}>
            <div className="flex flex-col gap-3 z-[2] flex-shrink-0 w-full">
              <div>
                <p className="text-sm text-foreground">Try the AI Assistant</p>
                <p className="text-sm text-foreground-lighter">
                  Ask the AI assistant to help you with your support issue
                </p>
              </div>
              <div>
                <Link href={aiLink} onClick={onAiAssistantClicked}>
                  <Button size="tiny" type="default">
                    Ask AI assistant
                  </Button>
                </Link>
              </div>
            </div>
            {!isCondensed && (
              <div className="absolute z-[1] scale-75 -right-24 top-0">
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
                <div className="absolute -inset-2 bg-gradient-to-l from-transparent via-background-200 via-[95%] to-background-200 to-[100%] z-[1]" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
