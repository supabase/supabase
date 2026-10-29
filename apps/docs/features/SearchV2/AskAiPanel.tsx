'use client'

import { SearchInputRow, type SearchDialogProps } from 'docs-search/components'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from 'react'
import {
  MessageRole,
  MessageStatus,
  useAiChat,
  type Message,
} from 'ui-patterns/CommandMenu/prepackaged/ai'
import { Markdown } from 'ui-patterns/Markdown'

import { AskAiIcon } from './AskAiIcon'
import { CurvedScrollArea } from '@/features/ui/CurvedScrollArea'
import { useSendTelemetryEvent } from '@/lib/telemetry'

interface AskAiPanelProps {
  initialQuestion: string
}

interface AiMessagesProps {
  messages: Message[]
  hasError: boolean
}

interface AiSourcesProps {
  sources: NonNullable<Message['sources']>
  onSourceClick: (sourcePath: string) => void
}

export const ASK_AI_DIALOG_LABELS: SearchDialogProps['labels'] = {
  dialogTitle: 'Ask Supabase AI',
  dialogDescription: 'Ask about the Supabase docs',
}

export function AskAiPanel({ initialQuestion }: AskAiPanelProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { submit, reset, messages, isResponding, hasError } = useAiChat({ setIsLoading })
  const sendTelemetryEvent = useSendTelemetryEvent()
  const inputRef = useRef<HTMLInputElement>(null)
  const isPinnedRef = useRef(true)
  const lastScrollTopRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const isBusy = isLoading || isResponding
  const hasConversation = messages.length > 0
  const hasAnswer = messages.some(
    ({ role, content }) => role === MessageRole.Assistant && content !== ''
  )

  // exception: asks the question that search sent on mount. the dialog unmounts this panel
  // on close, so the cleanup closes the answer stream
  useEffect(() => {
    if (initialQuestion) submit(initialQuestion)
    return reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isBusy) return
    submit(trimmedQuestion)
    sendTelemetryEvent({
      action: 'docs_search_v2_ask_ai_question_submitted',
      properties: { question: trimmedQuestion, questionSource: 'typed' },
    })
    setQuestion('')
    isPinnedRef.current = true
  }

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const list = event.currentTarget
    if (list.scrollHeight - list.scrollTop - list.clientHeight < 32) isPinnedRef.current = true
    else if (list.scrollTop < lastScrollTopRef.current) isPinnedRef.current = false
    lastScrollTopRef.current = list.scrollTop
  }

  // follows the question and the streamed answer while the reader stays at the bottom.
  // a stable callback ref, so react does not create the observer again on each render
  const followConversation = useCallback((content: HTMLDivElement | null) => {
    if (!content) return
    const observer = new ResizeObserver(() => {
      const list = listRef.current
      if (list && isPinnedRef.current) list.scrollTop = list.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // enter confirms an IME composition, so it must not submit
    if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
  }

  const handleQuestionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value)
  }

  // focus stays in the input while the answer renders, so this tells a screen reader what changed.
  // it never reads the streamed text
  const getStatusMessage = (): string => {
    if (hasError) return 'No answer from Supabase AI. Try again in a moment.'
    if (isLoading) return 'Searching the docs…'
    if (isResponding) return 'Writing the answer…'
    if (messages.at(-1)?.status === MessageStatus.Complete) return 'Answer ready.'
    return ''
  }

  // reset() does not clear the loading state that submit sets. the clear button unmounts with
  // the conversation, so focus goes back to the input
  const handleClear = () => {
    reset()
    setIsLoading(false)
    setQuestion('')
    inputRef.current?.focus()
  }

  return (
    <section className="flex flex-col">
      <div role="status" aria-live="polite" className="sr-only">
        {getStatusMessage()}
      </div>
      {hasConversation ? (
        <div className="relative">
          <CurvedScrollArea
            viewportRef={listRef}
            onScroll={handleListScroll}
            className="max-h-[min(477px,70dvh)] mx-px scroll-fade-bottom"
          >
            <div ref={followConversation}>
              <AiMessages messages={messages} hasError={hasError} />
              {hasAnswer ? (
                <p className="px-4 pt-4 pb-3 text-center text-xs text-foreground-lighter">
                  Supabase AI can make mistakes. Verify answers before you run them.
                </p>
              ) : null}
            </div>
          </CurvedScrollArea>
          <div aria-hidden className="ask-ai-edge" />
        </div>
      ) : null}
      <form onSubmit={handleSubmit}>
        <SearchInputRow
          icon={<AskAiIcon isThinking={isBusy} className="size-full" />}
          onClear={hasConversation ? handleClear : undefined}
          // under a conversation the input is far from the search input, so a morph moves it across the dialog
          hasMorph={!hasConversation}
          className={hasConversation ? 'border-t' : undefined}
        >
          <span className="relative flex size-full items-center">
            <input
              ref={inputRef}
              autoFocus
              autoComplete="off"
              data-1p-ignore // 1Password
              data-lpignore="true" // LastPass
              data-form-type="other" // Dashlane
              data-bwignore // Bitwarden
              value={question}
              onChange={handleQuestionChange}
              onKeyDown={handleKeyDown}
              placeholder={isBusy ? undefined : 'Ask Supabase AI a question'}
              aria-label="Ask Supabase AI a question"
              className="size-full border-none bg-transparent p-0 text-search-dialog outline-hidden placeholder:text-foreground-lighter focus:ring-0"
            />
            {isLoading && !question ? (
              <span
                aria-hidden
                className="shimmer pointer-events-none absolute inset-y-0 left-0 flex items-center text-search-dialog text-foreground-lighter"
              >
                Searching the docs
              </span>
            ) : null}
          </span>
        </SearchInputRow>
      </form>
    </section>
  )
}

function AiMessages({ messages, hasError }: AiMessagesProps) {
  const sendTelemetryEvent = useSendTelemetryEvent()
  // the input shows a pending answer. a failed request leaves its answer incomplete.
  // the last answer failed when an error is set, and an earlier answer failed when it is incomplete
  const isFailedAnswer = (message: Message, index: number) =>
    message.status !== MessageStatus.Complete && (hasError || index < messages.length - 1)

  // an answer always follows the question it answers
  const handleSourceClick = ({
    sourcePath,
    answerIndex,
  }: {
    sourcePath: string
    answerIndex: number
  }) => {
    sendTelemetryEvent({
      action: 'docs_search_v2_ask_ai_source_clicked',
      properties: { sourcePath, question: messages[answerIndex - 1]?.content ?? '' },
    })
  }

  return (
    <ol className="flex flex-col gap-4 py-4 pr-4 pl-3">
      {messages.map((message, index) =>
        message.role === MessageRole.User ? (
          // messages have no id and are only ever appended, so the index is stable
          <li
            key={index}
            className="max-w-[80%] self-end rounded-2xl bg-surface-400 px-3 py-1.5 text-search-dialog text-foreground wrap-break-word"
          >
            {message.content}
          </li>
        ) : message.status === MessageStatus.Pending && !isFailedAnswer(message, index) ? null : (
          <li
            key={index}
            aria-busy={!isFailedAnswer(message, index) && message.status !== MessageStatus.Complete}
          >
            {message.status === MessageStatus.Pending ? null : (
              <Markdown
                codeBlock
                className="ask-ai-answer prose-sm wrap-break-word"
                components={{
                  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}
              >
                {message.content}
              </Markdown>
            )}
            {isFailedAnswer(message, index) ? (
              <p className="text-search-dialog text-foreground-lighter">
                No answer from Supabase AI. Try again in a moment.
              </p>
            ) : null}
            {message.sources?.length ? (
              <AiSources
                sources={message.sources}
                onSourceClick={(sourcePath) =>
                  handleSourceClick({ sourcePath, answerIndex: index })
                }
              />
            ) : null}
          </li>
        )
      )}
    </ol>
  )
}

function AiSources({ sources, onSourceClick }: AiSourcesProps) {
  return (
    <nav aria-label="Sources" className="mt-3">
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <li key={source.path}>
            <Link
              href={source.path}
              target="_blank"
              rel="noopener noreferrer"
              prefetch={false}
              onClick={() => onSourceClick(source.path)}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-400 px-2.5 py-1 text-xs text-foreground-light transition-colors hover:text-foreground focus-ring"
            >
              <FileText aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
              {source.path}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
