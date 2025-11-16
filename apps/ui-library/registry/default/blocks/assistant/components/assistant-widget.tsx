'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/registry/default/blocks/assistant/lib/supabase/client'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/registry/default/components/ai-elements/conversation'
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
} from '@/registry/default/components/ai-elements/message'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/registry/default/components/ai-elements/model-selector'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/registry/default/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/registry/default/components/ai-elements/reasoning'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/registry/default/components/ai-elements/sources'
import { Suggestion, Suggestions } from '@/registry/default/components/ai-elements/suggestion'
import { Button } from '@/registry/default/components/ui/button'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { GlobeIcon, MessageSquare, MicIcon, Minimize2, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

const suggestions = [
  'Show me my recent orders',
  'How many active users do we have?',
  'List all tasks due this week',
  "Summarize today's signups",
]

const models = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    chef: 'OpenAI',
    chefSlug: 'openai',
    providers: ['openai', 'azure'],
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic', 'azure', 'google', 'amazon-bedrock'],
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    chef: 'Google',
    chefSlug: 'google',
    providers: ['google'],
  },
]

type TextPart = {
  type: 'text'
  text: string
}

type SourcePart = {
  type: 'source-url'
  url: string
  title?: string
}

type ReasoningPart = {
  type: 'reasoning'
  text: string
}

type FormattedMessage = {
  key: string
  from: 'user' | 'assistant'
  sources?: { href: string; title: string }[]
  versions: { id: string; content: string }[]
  reasoning?: { content: string; duration?: number }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const DEFAULT_CHAT_API = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : '/functions/v1/chat'
const CHAT_API_URL = 'https://idglwaxxhycmeyjvbbbr.supabase.co/functions/v1/chat'

export function AssistantWidget() {
  const supabase = useMemo(() => createClient(), [])
  const getAuthHeaders = useCallback(async () => {
    let {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously()

      if (error || !data.session) {
        throw error ?? new Error('Unable to authenticate anonymously.')
      }

      session = data.session
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  }, [supabase])

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [text, setText] = useState('')
  const [model, setModel] = useState(models[0].id)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [useMicrophone, setUseMicrophone] = useState(false)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: CHAT_API_URL,
    }),
    onError: (chatError) => {
      toast.error('Failed to send message', {
        description: chatError.message,
      })
    },
  })

  const selectedModelData = models.find((entry) => entry.id === model)

  const formattedMessages = useMemo<FormattedMessage[]>(() => {
    return messages.map((message) => {
      const parts = message.parts ?? []

      const textParts =
        parts.filter((part): part is TextPart => part?.type === 'text') ??
        (Array.isArray(message.content)
          ? message.content.filter(
              (part): part is TextPart => typeof part === 'object' && part.type === 'text'
            )
          : [])

      const versions =
        textParts.length > 0
          ? textParts.map((part, index) => ({
              id: `${message.id}-${index}`,
              content: part.text,
            }))
          : [
              {
                id: `${message.id}-content`,
                content:
                  typeof message.content === 'string'
                    ? message.content
                    : message.content
                        ?.map((part) =>
                          typeof part === 'string' ? part : part.type === 'text' ? part.text : ''
                        )
                        .join('')
                        .trim() ?? '',
              },
            ]

      const sources = parts
        .filter((part): part is SourcePart => part?.type === 'source-url')
        .map((part) => ({
          href: part.url,
          title: part.title ?? part.url,
        }))

      const reasoningPart = parts.find((part): part is ReasoningPart => part?.type === 'reasoning')

      return {
        key: message.id,
        from: message.role === 'assistant' ? 'assistant' : 'user',
        sources,
        versions,
        reasoning: reasoningPart
          ? {
              content: reasoningPart.text,
            }
          : undefined,
      }
    })
  }, [messages])

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim())
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments) || status === 'streaming') {
      return
    }

    if (message.files?.length) {
      toast.success('Files attached', {
        description: `${message.files.length} file(s) attached to message`,
      })
    }

    try {
      const headers = await getAuthHeaders()
      await sendMessage(
        {
          text: message.text?.trim() ?? 'Sent with attachments',
          files: message.files,
        },
        {
          headers,
          body: {
            model,
            webSearch: useWebSearch,
          },
        }
      )
      setText('')
    } catch (sendError) {
      toast.error('Failed to send message', {
        description: sendError instanceof Error ? sendError.message : 'Unknown error occurred.',
      })
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    if (status === 'streaming' || status === 'submitted') return
    try {
      const headers = await getAuthHeaders()
      await sendMessage(
        { text: suggestion },
        {
          headers,
          body: { model, webSearch: useWebSearch },
        }
      )
    } catch (sendError) {
      toast.error('Failed to send message', {
        description: sendError instanceof Error ? sendError.message : 'Unknown error occurred.',
      })
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  const submitDisabled = (!text.trim() && status !== 'streaming') || status === 'streaming'

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col rounded-lg border bg-background shadow-2xl transition-all',
        isMinimized ? 'h-14 w-80' : 'h-[640px] w-[420px]'
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by MCP</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized((prev) => !prev)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex h-full flex-col divide-y overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Conversation className="flex h-full flex-col">
              <ConversationContent>
                {formattedMessages.map(({ key, versions, sources, reasoning, from }) => (
                  <MessageBranch defaultBranch={0} key={key}>
                    <MessageBranchContent>
                      {versions.map((version) => (
                        <Message from={from} key={`${key}-${version.id}`}>
                          <div>
                            {sources && sources.length > 0 && (
                              <Sources>
                                <SourcesTrigger count={sources.length} />
                                <SourcesContent>
                                  {sources.map((source) => (
                                    <Source
                                      key={source.href}
                                      href={source.href}
                                      title={source.title}
                                    />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            )}

                            {reasoning && (
                              <Reasoning>
                                <ReasoningTrigger />
                                <ReasoningContent>{reasoning.content}</ReasoningContent>
                              </Reasoning>
                            )}

                            <MessageContent>
                              <MessageResponse>{version.content}</MessageResponse>
                            </MessageContent>
                          </div>
                        </Message>
                      ))}
                    </MessageBranchContent>
                    {versions.length > 1 && (
                      <MessageBranchSelector from={from}>
                        <MessageBranchPrevious />
                        <MessageBranchPage />
                        <MessageBranchNext />
                      </MessageBranchSelector>
                    )}
                  </MessageBranch>
                ))}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          <div className="grid shrink-0 gap-4 pt-4">
            <Suggestions className="px-4">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </Suggestions>
            <div className="w-full px-4 pb-4">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputHeader>
                  <PromptInputAttachments>
                    {(attachment) => <PromptInputAttachment data={attachment} />}
                  </PromptInputAttachments>
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Ask me anything about your Supabase data..."
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <PromptInputButton
                      onClick={() => setUseMicrophone((prev) => !prev)}
                      variant={useMicrophone ? 'default' : 'ghost'}
                      type="button"
                    >
                      <MicIcon size={16} />
                      <span className="sr-only">Microphone</span>
                    </PromptInputButton>
                    <PromptInputButton
                      onClick={() => setUseWebSearch((prev) => !prev)}
                      variant={useWebSearch ? 'default' : 'ghost'}
                      type="button"
                    >
                      <GlobeIcon size={16} />
                      <span>Search</span>
                    </PromptInputButton>
                    <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
                      <ModelSelectorTrigger asChild>
                        <PromptInputButton type="button">
                          {selectedModelData?.chefSlug && (
                            <ModelSelectorLogo provider={selectedModelData.chefSlug} />
                          )}
                          {selectedModelData?.name && (
                            <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
                          )}
                        </PromptInputButton>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent>
                        <ModelSelectorInput placeholder="Search models..." />
                        <ModelSelectorList>
                          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                          {['OpenAI', 'Anthropic', 'Google'].map((chef) => (
                            <ModelSelectorGroup key={chef} heading={chef}>
                              {models
                                .filter((entry) => entry.chef === chef)
                                .map((entry) => (
                                  <ModelSelectorItem
                                    key={entry.id}
                                    value={entry.id}
                                    onSelect={() => {
                                      setModel(entry.id)
                                      setModelSelectorOpen(false)
                                    }}
                                  >
                                    <ModelSelectorLogo provider={entry.chefSlug} />
                                    <ModelSelectorName>{entry.name}</ModelSelectorName>
                                    <ModelSelectorLogoGroup>
                                      {entry.providers.map((provider) => (
                                        <ModelSelectorLogo key={provider} provider={provider} />
                                      ))}
                                    </ModelSelectorLogoGroup>
                                    {model === entry.id ? (
                                      <span className="ml-auto text-xs text-foreground">
                                        Selected
                                      </span>
                                    ) : (
                                      <div className="ml-auto h-4 w-4" />
                                    )}
                                  </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                          ))}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>
                  </PromptInputTools>
                  <PromptInputSubmit status={status} disabled={submitDisabled} />
                </PromptInputFooter>
              </PromptInput>
              {error && <p className="mt-2 text-xs text-destructive">{error.message}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
