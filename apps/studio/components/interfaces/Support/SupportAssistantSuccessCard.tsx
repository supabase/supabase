import { useChat, type UIMessage as MessageType } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AiIconAnimation,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
} from 'ui'

import { buildSupportAssistantPrompt } from './SupportAssistant.utils'
import type { SubmittedSupportRequest } from './SupportForm.state'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
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
  const hasAssistantContext = hasProjectScopedAssistantContext(request.projectRef)
  const aiAssistant = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const createdChatIdRef = useRef<string>()
  const [chatId, setChatId] = useState<string>()
  const chat = chatId ? aiAssistant.chatInstances[chatId] : undefined

  const assistantPrompt = useMemo(() => buildSupportAssistantPrompt(request), [request])

  useEffect(() => {
    if (!hasAssistantContext) return
    if (createdChatIdRef.current) return

    const newChatId = aiAssistant.newChat({
      name: 'Support request',
      initialMessage: assistantPrompt,
    })

    createdChatIdRef.current = newChatId
    setChatId(newChatId)
  }, [aiAssistant, assistantPrompt, hasAssistantContext])

  const handleOpenAssistant = () => {
    if (chatId) {
      aiAssistant.selectChat(chatId)
    }
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
  }

  if (!hasAssistantContext) return null

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label="Open assistant response"
      onClick={handleOpenAssistant}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpenAssistant()
        }
      }}
      className={cn(
        'group cursor-pointer bg-muted/50 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background">
            <AiIconAnimation size={14} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle>While you wait</CardTitle>
            <CardDescription>Assistant may be able to help</CardDescription>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          strokeWidth={1.5}
          className="shrink-0 text-foreground-lighter transition-colors group-hover:text-foreground"
          aria-hidden
        />
      </CardHeader>
      {chatId && chat ? (
        <SupportAssistantResponsePreview
          chatId={chatId}
          chat={chat as SupportAssistantPreviewChat}
          maxCharacters={SUPPORT_ASSISTANT_PREVIEW_MAX_CHARACTERS}
        />
      ) : (
        <CardContent>
          <SupportAssistantResponseLoadingSkeleton />
        </CardContent>
      )}
    </Card>
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
  maxCharacters,
}: {
  chatId: string
  chat: SupportAssistantPreviewChat
  maxCharacters: number
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
      <CardContent>
        <SupportAssistantResponseLoadingSkeleton />
      </CardContent>
    )
  }

  const { message: previewMessage, wasTruncated } = truncateAssistantMessage(
    latestAssistantMessage,
    maxCharacters
  )

  return (
    <CardContent className="relative max-h-48 overflow-hidden">
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
  )
}

function SupportAssistantResponseLoadingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[82%]" />
      <Skeleton className="h-4 w-[92%]" />
      <Skeleton className="h-4 w-[68%]" />
    </div>
  )
}
