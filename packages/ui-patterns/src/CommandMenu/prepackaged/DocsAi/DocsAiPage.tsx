'use client'

import { useBreakpoint } from 'common'
import { User } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  AiIconAnimation,
  Button,
  cn,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  markdownComponents,
} from 'ui'
import { StatusIcon } from 'ui/src/components/StatusIcon'

import {
  Breadcrumb,
  CommandHeader,
  CommandInput,
  CommandWrapper,
  generateCommandClassNames,
  useHistoryKeys,
  useQuery,
  useSetCommandMenuSize,
  useSetQuery,
} from '../..'
import { AiWarning, Message, MessageRole, MessageStatus, useAiChat } from '../ai'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const DocsAiPage = () => {
  const setQuery = useSetQuery()

  const isBelowSm = useBreakpoint('sm')

  /**
   * Interface for AI interaction is larger to allow more reading space.
   */
  useSetCommandMenuSize('xlarge')

  const [isLoading, setIsLoading] = useState(false)

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    setIsLoading,
  })

  const handleSubmit = useCallback(
    (message: string) => {
      setQuery('')
      submit(message)
    },
    [submit]
  )

  const handleReset = useCallback(() => {
    setQuery('')
    reset()
  }, [reset])

  return (
    <CommandWrapper
      className={cn(
        'flex flex-col',
        !isBelowSm &&
          '[&_[cmdk-input-wrapper]]:border-b-0 [&_[cmdk-input-wrapper]]:border-t [&_[cmdk-input-wrapper]]:border-solid [&_[cmdk-input-wrapper]]:border-bg-control'
      )}
    >
      <CommandHeader>
        <Breadcrumb />
        {isBelowSm && (
          <PromptInput
            submit={handleSubmit}
            reset={handleReset}
            messages={messages}
            isLoading={isLoading}
            isResponding={isResponding}
          />
        )}
      </CommandHeader>
      <div className={cn('flex-grow min-h-0 overflow-auto')}>
        {!hasError && messages.length > 0 && <AiMessages messages={messages} />}
        {!hasError && messages.length === 0 && <EmptyState handleSubmit={handleSubmit} />}
        {hasError && <ErrorState handleReset={handleReset} />}
      </div>
      {!isBelowSm && (
        <PromptInput
          submit={handleSubmit}
          reset={handleReset}
          messages={messages}
          isLoading={isLoading}
          isResponding={isResponding}
        />
      )}
      {messages.length > 0 && !hasError && (
        <AiWarning className={isBelowSm ? 'rounded-b-none' : 'rounded-t-none'} />
      )}
    </CommandWrapper>
  )
}

function PromptInput({
  submit,
  reset,
  messages,
  isLoading,
  isResponding,
  className,
}: {
  submit: (query: string) => void
  reset: () => void
  messages: Array<Message>
  isLoading: boolean
  isResponding: boolean
  className?: string
}) {
  const query = useQuery()
  const previousQuery = useRef(query)
  const setQuery = useSetQuery()
  // If the user has already typed something when they select Supabase AI, we want to
  // submit it immediately.
  useEffect(() => {
    if (query) {
      submit(query)
    }
    return reset
  }, [])

  const [inputValue, setInputValue] = useState('')
  // Support CJK IME input
  const [isImeComposing, setIsImeComposing] = useState(false)
  useEffect(() => {
    if (query !== previousQuery.current) {
      setInputValue(query)
      previousQuery.current = query
    } else if (!isImeComposing) {
      setQuery(inputValue)
      previousQuery.current = inputValue
    }
  }, [inputValue, query, isImeComposing])

  useHistoryKeys({
    enable: !isResponding,
    stack: messages.filter(({ role }) => role === MessageRole.User).map(({ content }) => content),
  })

  return (
    <CommandInput
      className={cn(
        'w-full h-11',
        'border-none outline-none bg-transparent rounded-none rounded-t-md px-4 py-7',
        'flex',
        'text-base text-foreground-light',
        'focus:ring-0 focus:shadow-none focus:ring-transparent',
        'focus-visible:ring-0 focus-visible:shadow-none focus-visible:ring-transparent',
        'placeholder:text-foreground-muted',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      placeholder={
        isLoading || isResponding ? 'Waiting on an answer...' : 'Ask Supabase AI a question...'
      }
      value={inputValue}
      onValueChange={setInputValue}
      onCompositionStart={() => setIsImeComposing(true)}
      onCompositionEnd={() => setIsImeComposing(false)}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'Enter':
            if (!query || isLoading || isResponding || isImeComposing) {
              return
            }
            return submit(query)
          default:
            return
        }
      }}
    />
  )
}

function AiMessages({ messages }: { messages: Array<Message> }) {
  return (
    <>
      {/* cmdk menus need a CommandList descendent in order to not throw an
      error. This display doesn't actually need the Command Menu, but it's
      needed for the empty state to work with the input, so this is a somewhat
      hacktastic way of making it not error. */}
      <CommandList_Shadcn_ />
      <div
        className={cn(
          'flex-grow min-h-0 overflow-auto p-4',
          'grid gap-6 md:grid-cols-[max-content,1fr] grid-rows-[max-content]'
        )}
      >
        {messages.map((message, index) => {
          switch (message.role) {
            case MessageRole.User:
              return (
                <Fragment key={index}>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-7 h-7',
                        'border border-muted bg-background shadow-sm rounded-full',
                        'flex items-center justify-center',
                        'text-foreground-lighter'
                      )}
                    >
                      <User strokeWidth={1.5} size={16} />
                    </div>
                    <span className="font-mono text-sm text-foreground-muted uppercase tracking-widest md:hidden">
                      You
                    </span>
                  </div>
                  <div className="prose text-foreground-lighter">{message.content}</div>
                </Fragment>
              )
            case MessageRole.Assistant:
              return (
                <Fragment key={index}>
                  <div className="flex items-center md:items-start gap-4">
                    <AiIconAnimation
                      className="ml-0.5"
                      loading={
                        message.status === MessageStatus.Pending ||
                        message.status === MessageStatus.InProgress
                      }
                      allowHoverEffect
                    />
                    <span className="font-mono text-sm text-foreground-muted uppercase tracking-widest md:hidden">
                      Supabase AI
                    </span>
                  </div>
                  <div>
                    {message.status === MessageStatus.Pending && (
                      <span className="inline-block h-[1lh] w-[0.8lh] mt-1 bg-border-strong animate-bounce" />
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        ...markdownComponents,
                        a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                      }}
                      className="prose dark:prose-dark break-words"
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border-muted">
                        <p className="text-sm text-foreground-muted mb-2">Sources:</p>
                        <ul className="space-y-1">
                          {message.sources.map((source, idx) => (
                            <li key={idx}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand hover:underline"
                              >
                                {source.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Fragment>
              )
          }
        })}
      </div>
    </>
  )
}

function EmptyState({ handleSubmit }: { handleSubmit: (message: string) => void }) {
  const query = useQuery()

  return (
    <CommandList_Shadcn_ className="max-h-[unset]">
      <CommandGroup_Shadcn_
        heading="Examples"
        className={cn(
          'text-border-strong',
          '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5',
          '[&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted'
        )}
      >
        {questions.map((question) => {
          const key = question.replace(/\s+/g, '_')
          return (
            <CommandItem_Shadcn_
              className={generateCommandClassNames(false)}
              onSelect={() => {
                if (!query) {
                  handleSubmit(question)
                }
              }}
              key={key}
            >
              <AiIconAnimation />
              {question}
            </CommandItem_Shadcn_>
          )
        })}
      </CommandGroup_Shadcn_>
    </CommandList_Shadcn_>
  )
}

function ErrorState({ handleReset }: { handleReset: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center gap-2 mt-4">
      <StatusIcon variant="warning" />
      <p className="text-sm text-foreground text-center">
        Sorry, looks like Supabase AI is having a hard time!
      </p>
      <p className="text-sm text-foreground-lighter text-center">Please try again in a bit.</p>
      <Button size="tiny" type="default" onClick={handleReset}>
        Try again?
      </Button>
    </div>
  )
}

export { DocsAiPage }
