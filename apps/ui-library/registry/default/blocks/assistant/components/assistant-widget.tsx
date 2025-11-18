'use client'
import { createClient } from '@/registry/default/blocks/assistant/lib/supabase/client'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/registry/default/components/ai-elements/conversation'
import {
  Message,
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
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/registry/default/components/ai-elements/model-selector'
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/registry/default/components/ai-elements/prompt-input'
import { Suggestion, Suggestions } from '@/registry/default/components/ai-elements/suggestion'
import { Button } from '@/registry/default/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/default/components/ui/popover'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { CheckIcon, MessageCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL

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
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    chef: 'Anthropic',
    chefSlug: 'anthropic',
    providers: ['anthropic', 'azure', 'google', 'amazon-bedrock'],
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

const suggestions = [
  'What are the latest trends in AI?',
  'How does machine learning work?',
  'Explain quantum computing',
  'Best practices for React development',
  'Tell me about TypeScript benefits',
  'How to optimize database queries?',
  'What is the difference between SQL and NoSQL?',
  'Explain cloud computing basics',
]

interface AssistantWidgetProps {
  /**
   * Override the trigger positioning if you need to embed the widget in a scoped container.
   */
  triggerClassName?: string
}

export const AssistantWidget = ({
  triggerClassName = 'fixed bottom-6 right-6',
}: AssistantWidgetProps = {}) => {
  const [model, setModel] = useState<string>(models[0].id)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [text, setText] = useState<string>('')
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false)

  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session) {
      throw new Error('No active session found. Please sign in.')
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    }
  }, [])

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: CHAT_API_URL,
      headers: async () => {
        try {
          return await getAuthHeaders()
        } catch (error) {
          console.error('Authentication error:', error)
          toast.error('Failed to authenticate')
          return {}
        }
      },
      body: () => ({
        model,
        useWebSearch,
      }),
    }),
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('Failed to send message', {
        description: error.message,
      })
    },
    onFinish: () => {
      // Successfully finished streaming
    },
  })

  const selectedModelData = models.find((m) => m.id === model)

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text)
      const hasAttachments = Boolean(message.files?.length)

      if (!(hasText || hasAttachments)) {
        return
      }

      if (message.files?.length) {
        toast.success('Files attached', {
          description: `${message.files.length} file(s) attached to message`,
        })
      }

      sendMessage({ text: message.text || 'Sent with attachments' })
      setText('')
    },
    [sendMessage]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion })
    },
    [sendMessage]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open assistant"
          className={`${triggerClassName} h-12 w-12 rounded-full shadow-lg`}
          size="icon"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="h-[480px] w-[480px] p-0 flex flex-col gap-0"
        side="top"
        sideOffset={16}
      >
        <Conversation className="flex-1 border-b">
          <ConversationContent>
            {messages.map(({ role, parts }, index) => (
              <Message from={role} key={index}>
                <MessageContent>
                  {parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <MessageResponse key={`${role}-${i}`}>{part.text}</MessageResponse>
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <Suggestions className="p-3">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea onChange={(event) => setText(event.target.value)} value={text} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData?.chefSlug && (
                        <ModelSelectorLogo
                          className="dark:invert"
                          provider={selectedModelData.chefSlug}
                        />
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
                            .filter((m) => m.chef === chef)
                            .map((m) => (
                              <ModelSelectorItem
                                key={m.id}
                                onSelect={() => {
                                  setModel(m.id)
                                  setModelSelectorOpen(false)
                                }}
                                value={m.id}
                              >
                                <ModelSelectorLogo className="dark:invert" provider={m.chefSlug} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                {model === m.id ? (
                                  <CheckIcon className="ml-auto size-4" />
                                ) : (
                                  <div className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!(text.trim() || status) || status === 'streaming'}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AssistantWidget
