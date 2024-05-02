import { AlertTriangle, CornerDownLeft, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  AiIconAnimation,
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  Input,
  cn,
  markdownComponents,
} from 'ui'

import { AiWarning } from '../ai'

import { CommandWrapper } from '../../api/CommandMenu'
import { useQuery, useSetQuery } from '../../api/hooks/queryHooks'
import { useHistoryKeys } from '../../api/hooks/useHistoryKeys'
import { useSetCommandMenuSize } from '../../api/hooks/viewHooks'
import { MessageRole, MessageStatus, useAiChat } from '../ai'
import { generateCommandClassNames } from '../../internal/Command'

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
  'How do I set up authentication?',
]

const DocsAiPage = () => {
  const query = useQuery()
  const setQuery = useSetQuery()

  /**
   * Interface for AI interaction is larger to allow more reading space.
   */
  useSetCommandMenuSize('xlarge')

  const [isLoading, setIsLoading] = useState(false)

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    setIsLoading,
  })

  useHistoryKeys({
    enable: !isResponding,
    stack: messages.filter(({ role }) => role === MessageRole.User).map(({ content }) => content),
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

  useEffect(() => {
    if (query) {
      handleSubmit(query)
    }
  }, [])

  // Detect an IME composition (so that we can ignore Enter keypress)
  const [isImeComposing, setIsImeComposing] = useState(false)

  return (
    <CommandWrapper>
      <div className={cn('h-[min(720px,50dvh)] max-h-[min(720px,50dvh)] py-4 overflow-y-auto')}>
        {!hasError &&
          messages.map((message, index) => {
            switch (message.role) {
              case MessageRole.User:
                return (
                  <div key={index} className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                    <div
                      className="
                  w-7 h-7 bg-background rounded-full border border-muted flex items-center justify-center text-foreground-lighter first-letter:
                  ring-background
                  ring-1
                  shadow-sm
              "
                    >
                      <User strokeWidth={1.5} size={16} />
                    </div>
                    <div className="prose text-foreground-lighter">{message.content}</div>
                  </div>
                )
              case MessageRole.Assistant:
                return (
                  <div key={index} className="px-4 [overflow-anchor:none]">
                    <div className="flex gap-6 [overflow-anchor:none] mb-6">
                      <AiIconAnimation
                        className="ml-0.5"
                        loading={
                          message.status === MessageStatus.Pending ||
                          message.status === MessageStatus.InProgress
                        }
                        allowHoverEffect
                      />

                      <>
                        {message.status === MessageStatus.Pending ? (
                          <div className="bg-border-strong h-[21px] w-[13px] mt-1 animate-pulse animate-bounce"></div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                            linkTarget="_blank"
                            className="prose dark:prose-dark"
                            transformLinkUri={(href) => {
                              const supabaseUrl = new URL('https://supabase.com')
                              const linkUrl = new URL(href, 'https://supabase.com')

                              if (linkUrl.origin === supabaseUrl.origin) {
                                return linkUrl.toString()
                              }

                              return href
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </>
                    </div>
                  </div>
                )
            }
          })}

        {messages.length === 0 && !hasError && (
          <CommandGroup_Shadcn_
            heading="Examples"
            className="overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted"
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
        )}

        {hasError && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <AlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
            <p className="text-lg text-foreground text-center">
              Sorry, looks like Clippy is having a hard time!
            </p>
            <p className="text-sm text-foreground-muted text-center">Please try again in a bit.</p>
            <Button size="tiny" type="secondary" onClick={handleReset}>
              Try again?
            </Button>
          </div>
        )}

        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>
      <div className="flex flex-col gap-3 p-3 bg-background">
        {messages.length > 0 && !hasError && <AiWarning />}
        <Input
          autoFocus
          className="bg-alternative rounded [&_input]:pr-32 md:[&_input]:pr-40"
          placeholder={
            isLoading || isResponding ? 'Waiting on an answer...' : 'Ask Supabase AI a question...'
          }
          value={query}
          actions={
            <>
              {!isLoading && !isResponding ? (
                <div
                  className={`flex items-center gap-3 mr-3 transition-opacity duration-700 ${
                    query ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="text-foreground-light">Submit message</span>
                  <div className="hidden text-foreground-light md:flex items-center justify-center h-6 w-6 rounded bg-overlay-hover">
                    <CornerDownLeft size={12} strokeWidth={1.5} />
                  </div>
                </div>
              ) : null}
            </>
          }
          onChange={(e) => {
            if (!isLoading || !isResponding) {
              setQuery(e.target.value)
            }
          }}
          onCompositionStart={() => setIsImeComposing(true)}
          onCompositionEnd={() => setIsImeComposing(false)}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!query || isLoading || isResponding || isImeComposing) {
                  return
                }
                return handleSubmit(query)
              default:
                return
            }
          }}
        />
      </div>
    </CommandWrapper>
  )
}

export { DocsAiPage }
