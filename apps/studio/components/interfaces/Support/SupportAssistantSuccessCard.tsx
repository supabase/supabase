import { useChat, type UIMessage as MessageType } from '@ai-sdk/react'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AiIconAnimation, Button, cn } from 'ui'

import { buildSupportAssistantPrompt } from './SupportAssistant.utils'
import type { SubmittedSupportRequest } from './SupportForm.state'
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

export function SupportAssistantSuccessCard({
  request,
  className,
}: SupportAssistantSuccessCardProps) {
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpenAssistant()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpenAssistant}
      onKeyDown={handleKeyDown}
      className={cn(
        'group w-full cursor-pointer rounded-md border bg-surface-75 p-4 text-left transition hover:border-strong hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <AiIconAnimation size={16} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground">Assistant is checking too</h4>
            <ArrowRight
              size={14}
              className="text-foreground-muted transition group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </div>
          <p className="text-sm text-foreground-light">
            Your request was also sent to Supabase Assistant to see if it can help while the support
            team reviews your ticket.
          </p>
          {chatId && chat && (
            <SupportAssistantResponsePreview
              chatId={chatId}
              chat={chat as SupportAssistantPreviewChat}
              className="mt-3"
              maxCharacters={SUPPORT_ASSISTANT_PREVIEW_MAX_CHARACTERS}
            />
          )}
          <div className="pt-2">
            <Button asChild type="default" size="tiny" icon={<MessageSquare size={14} />}>
              <span>Open Assistant chat</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
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
}: {
  chatId: string
  chat: SupportAssistantPreviewChat
  className?: string
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
      <div
        className={cn(
          'rounded-md border bg-background px-3 py-2 text-xs text-foreground-muted',
          className
        )}
      >
        Assistant is reviewing your request...
      </div>
    )
  }

  const { message: previewMessage, wasTruncated } = truncateAssistantMessage(
    latestAssistantMessage,
    maxCharacters
  )

  return (
    <div
      className={cn(
        'relative max-h-48 overflow-hidden rounded-md border bg-background p-3',
        className
      )}
    >
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  )
}
