import { useChat, type UIMessage as MessageType } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AiIconAnimation, Button, Card, CardContent, cn, Skeleton } from 'ui'

import { buildSupportAssistantPrompt } from './SupportAssistant.utils'
import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { SupportSuccessSection } from './SupportSuccessSection'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { Message } from '@/components/ui/AIAssistantPanel/Message'
import { useAiAssistantStateSnapshot, type AiAssistantState } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const SUPPORT_ASSISTANT_PREVIEW_MAX_CHARACTERS = 420
type SupportAssistantPreviewChat = AiAssistantState['chatInstances'][string]

interface SupportAssistantSuccessCardProps {
  request: SubmittedSupportRequest
  className?: string
}

function hasProjectScopedAssistantContext(projectRef: string | undefined) {
  return projectRef !== undefined && projectRef !== NO_PROJECT_MARKER
}

export function SupportAssistantSuccessCard({
  request,
  className,
}: SupportAssistantSuccessCardProps) {
  if (!hasProjectScopedAssistantContext(request.projectRef)) return null

  const aiAssistant = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const createdChatIdRef = useRef<string>()
  const [chatId, setChatId] = useState<string>()
  const chat = chatId ? aiAssistant.chatInstances[chatId] : undefined

  const assistantPrompt = useMemo(() => buildSupportAssistantPrompt(request), [request])

  useEffect(() => {
    if (createdChatIdRef.current) return

    const newChatId = aiAssistant.newChat({
      name: 'Support request',
      initialMessage: assistantPrompt,
    })

    createdChatIdRef.current = newChatId
    setChatId(newChatId)
  }, [aiAssistant, assistantPrompt])

  const handleOpenAssistant = () => {
    if (chatId) {
      aiAssistant.selectChat(chatId)
    }
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
  }

  return (
    <SupportSuccessSection
      className={className}
      headerClassName="sm:items-center"
      title="Assistant response"
      description={
        <p className="text-balance">
          Supabase Assistant is also reviewing your request in case it can help immediately.
        </p>
      }
      action={
        <Button
          type="default"
          size="tiny"
          icon={<AiIconAnimation size={14} />}
          onClick={handleOpenAssistant}
        >
          See reply
        </Button>
      }
    >
      {chatId && chat ? (
        <SupportAssistantResponsePreview
          chatId={chatId}
          chat={chat as SupportAssistantPreviewChat}
          maxCharacters={SUPPORT_ASSISTANT_PREVIEW_MAX_CHARACTERS}
          onOpen={handleOpenAssistant}
        />
      ) : (
        <SupportAssistantResponseCard onOpen={handleOpenAssistant}>
          <SupportAssistantResponseLoadingSkeleton />
        </SupportAssistantResponseCard>
      )}
    </SupportSuccessSection>
  )
}

function truncateAssistantMessage(message: MessageType, maxCharacters: number) {
  let remainingCharacters = maxCharacters
  let wasTruncated = false

  const truncatedParts = message.parts?.flatMap((part) => {
    if (part.type !== 'text') return []

    if (remainingCharacters <= 0) {
      wasTruncated = true
      return []
    }

    const text = part.text.slice(0, remainingCharacters)
    remainingCharacters -= text.length

    if (text.length < part.text.length) {
      wasTruncated = true
    }

    return [{ ...part, text: wasTruncated ? `${text.trimEnd()}...` : text }]
  })

  return {
    message: { ...message, parts: truncatedParts },
    wasTruncated,
  }
}

function SupportAssistantResponsePreview({
  chatId,
  chat,
  className,
  maxCharacters,
  onOpen,
}: {
  chatId: string
  chat: SupportAssistantPreviewChat
  className?: string
  maxCharacters: number
  onOpen: () => void
}) {
  const { messages, status } = useChat({
    id: chatId,
    chat,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  })

  const isChatLoading = status === 'submitted' || status === 'streaming'
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')

  if (!latestAssistantMessage) {
    return (
      <SupportAssistantResponseCard className={className} onOpen={onOpen}>
        <SupportAssistantResponseLoadingSkeleton />
      </SupportAssistantResponseCard>
    )
  }

  const { message: previewMessage, wasTruncated } = truncateAssistantMessage(
    latestAssistantMessage,
    maxCharacters
  )

  return (
    <SupportAssistantResponseCard className={cn('max-h-48', className)} onOpen={onOpen}>
      <CardContent className="p-3">
        <Message
          id={previewMessage.id}
          message={previewMessage}
          isLoading={isChatLoading}
          readOnly
          onDelete={() => {}}
          onEdit={() => {}}
          onCancelEdit={() => {}}
          isAfterEditedMessage={false}
          isBeingEdited={false}
        />
        {wasTruncated && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-muted to-transparent" />
        )}
      </CardContent>
    </SupportAssistantResponseCard>
  )
}

function SupportAssistantResponseLoadingSkeleton() {
  return (
    <CardContent className="space-y-2 p-3">
      <Skeleton className="h-4 w-[82%]" />
      <Skeleton className="h-4 w-[92%]" />
      <Skeleton className="h-4 w-[68%]" />
    </CardContent>
  )
}

function SupportAssistantResponseCard({
  children,
  className,
  onOpen,
}: {
  children: ReactNode
  className?: string
  onOpen: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'group relative cursor-pointer bg-muted/50 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className
      )}
    >
      <div className="pointer-events-none absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <Button type="default" size="tiny" className="h-8 w-8 p-0" tabIndex={-1} aria-hidden>
          <ArrowUpRight size={16} strokeWidth={1.5} className="text-foreground" />
        </Button>
      </div>
      {children}
    </Card>
  )
}
