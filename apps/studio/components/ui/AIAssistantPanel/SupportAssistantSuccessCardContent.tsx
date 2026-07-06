import type { UIMessage as MessageType } from '@ai-sdk/react'
import { ArrowUpRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { JSX } from 'react'
import type { StreamdownProps } from 'streamdown'
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

import { buildSupportAssistantPrompt } from '@/components/interfaces/Support/SupportAssistant.utils'
import type { SubmittedSupportRequest } from '@/components/interfaces/Support/SupportForm.state'
import { NO_PROJECT_MARKER } from '@/components/interfaces/Support/SupportForm.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot, type AiAssistantState } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

type SupportAssistantPreviewChat = AiAssistantState['chatInstances'][string]

const EMPTY_MESSAGES: MessageType[] = []

const Streamdown = dynamic<StreamdownProps>(
  () => import('streamdown').then((mod) => mod.Streamdown),
  { ssr: false }
)

interface SupportAssistantSuccessCardContentProps {
  request: SubmittedSupportRequest
  className?: string
}

function hasProjectScopedAssistantContext(projectRef: string | undefined) {
  return projectRef !== undefined && projectRef !== NO_PROJECT_MARKER
}

export function SupportAssistantSuccessCardContent({
  request,
  className,
}: SupportAssistantSuccessCardContentProps) {
  const hasAssistantContext = hasProjectScopedAssistantContext(request.projectRef)
  const aiAssistant = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const track = useTrack()
  const createdChatIdRef = useRef<string | null>(null)
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
    track(
      'support_assistant_follow_up_card_clicked',
      { ticketCategory: request.category },
      {
        project: request.projectRef,
        organization: request.organizationSlug,
      }
    )

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
      {chat ? (
        <SupportAssistantResponsePreview chat={chat as SupportAssistantPreviewChat} />
      ) : (
        <CardContent>
          <SupportAssistantResponseLoadingSkeleton />
        </CardContent>
      )}
    </Card>
  )
}

function useChatMessages(chat: SupportAssistantPreviewChat | undefined) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return chat?.['~registerMessagesCallback']?.(onStoreChange) ?? (() => {})
    },
    [chat]
  )

  const getSnapshot = useCallback(() => chat?.messages ?? EMPTY_MESSAGES, [chat])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function getAssistantMessageText(message: MessageType) {
  return (
    message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? ''
  )
}

function SupportAssistantResponsePreview({ chat }: { chat: SupportAssistantPreviewChat }) {
  const messages = useChatMessages(chat)

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

  const previewText = getAssistantMessageText(latestAssistantMessage)

  return (
    <CardContent className="relative max-h-48 overflow-hidden">
      <SupportAssistantPreviewMarkdown>{previewText}</SupportAssistantPreviewMarkdown>
    </CardContent>
  )
}

function SupportAssistantPreviewMarkdown({ children }: { children: string }) {
  return (
    <Streamdown
      className="prose prose-sm dark:prose-dark max-w-none space-y-3 text-sm text-foreground-light prose-p:my-0 prose-strong:font-medium prose-strong:text-foreground prose-code:text-xs prose-li:my-0 prose-ul:my-0 prose-ol:my-0"
      components={supportAssistantPreviewMarkdownComponents}
    >
      {children}
    </Streamdown>
  )
}

function SupportAssistantPreviewImage({ src }: JSX.IntrinsicElements['img']) {
  return <span className="font-mono text-foreground-lighter">[Image: {src?.toString()}]</span>
}

const supportAssistantPreviewMarkdownComponents: StreamdownProps['components'] = {
  img: SupportAssistantPreviewImage,
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
