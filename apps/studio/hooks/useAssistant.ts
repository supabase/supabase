import type { Message, Message as MessageType } from 'ai/react'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { ChatSession } from 'state/app-state'

export interface UseAssistantOptions {
  projectRef?: string
}

export function useAssistant(options?: UseAssistantOptions) {
  const { projectRef } = options || {}
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()

  const { chats, activeChatId, open } = aiAssistantPanel

  // Use useMemo to compute project-specific chats
  const { projectChatsRecord, projectChatEntries } = useMemo(() => {
    const record: Record<string, ChatSession> = {}
    const entries: Array<[string, ChatSession]> = []

    // Skip if no chats or projectRef
    if (!chats || !projectRef) {
      return { projectChatsRecord: record, projectChatEntries: entries }
    }

    // Filter chats by project reference
    const chatIds = Object.keys(chats)
    for (const id of chatIds) {
      const chat = chats[id]
      if (chat && chat.projectRef === projectRef) {
        // @ts-ignore - Suppress deep type instantiation error
        record[id] = chat
        // @ts-ignore - Suppress deep type instantiation error
        entries.push([id, chat])
      }
    }

    return { projectChatsRecord: record, projectChatEntries: entries }
  }, [chats, projectRef])

  // Check if the current active chat belongs to this project
  const currentChatBelongsToProject = Boolean(activeChatId && projectChatsRecord[activeChatId])

  useEffect(() => {
    if (projectRef) {
      if (projectRef && !currentChatBelongsToProject) {
        const chatIds = Object.keys(projectChatsRecord)
        if (chatIds.length > 0) {
          // Set active chat to the first chat of this project
          const newActiveChatId = chatIds[0]
          const activeChat = projectChatsRecord[newActiveChatId]

          if (activeChat) {
            setAiAssistantPanel({
              activeChatId: newActiveChatId,
            })
          }
        } else {
          // No chats for this project, create a new one
          const chatId = crypto.randomUUID()
          const newChat: ChatSession = {
            id: chatId,
            name: 'New Chat',
            projectRef: projectRef as string,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setAiAssistantPanel({
            chats: {
              ...(aiAssistantPanel.chats || {}),
              [chatId]: newChat,
            } as any,
            activeChatId: chatId,
          })
        }
      }
    }
  }, [projectRef])

  const handleNewChat = useCallback(() => {
    if (projectRef) {
      const chatId = crypto.randomUUID()
      const newChat: ChatSession = {
        id: chatId,
        name: 'New Chat',
        projectRef: projectRef as string,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setAiAssistantPanel({
        chats: {
          ...(aiAssistantPanel.chats || {}),
          [chatId]: newChat,
        } as any,
        activeChatId: chatId,
      })

      return chatId
    }
    return undefined
  }, [projectRef, setAiAssistantPanel, aiAssistantPanel.chats])

  const handleSelectChat = useCallback(
    (id: string) => {
      if (id !== activeChatId) {
        if (projectRef && projectChatsRecord) {
          // Check if the selected chat exists and belongs to the current project
          const targetChat = projectChatsRecord[id]
          if (!targetChat) {
            return
          }

          setAiAssistantPanel({
            activeChatId: id,
          })
        }
      }
    },
    [activeChatId, projectRef, projectChatsRecord, setAiAssistantPanel]
  )

  const handleDeleteChat = useCallback(
    (id: string) => {
      // Remove the chat with the given ID
      const { [id]: _, ...remainingChats } = chats

      // If the deleted chat was the active one, select a new active chat
      let newActiveChatId = activeChatId
      if (id === activeChatId) {
        // Get the IDs of the remaining chats for this project
        const projectChatIds = Object.keys(remainingChats).filter(
          (chatId) => remainingChats[chatId]?.projectRef === projectRef
        )
        newActiveChatId = projectChatIds.length > 0 ? projectChatIds[0] : undefined
      }

      setAiAssistantPanel({
        chats: remainingChats as any,
        activeChatId: newActiveChatId,
      })
    },
    [activeChatId, chats, projectRef, setAiAssistantPanel]
  )

  const handleRenameChat = useCallback(
    (id: string, name: string) => {
      // Only rename if it's a project chat
      const chat = projectChatsRecord[id]
      if (chat && chat.name !== name) {
        // Create new chats object with the updated chat
        const updatedChats = {
          ...chats,
          [id]: {
            ...chat,
            name,
            updatedAt: new Date(),
          },
        } as Record<string, ChatSession>

        setAiAssistantPanel({
          chats: updatedChats,
        })
      }
    },
    [projectChatsRecord]
  )

  const handleClearMessages = useCallback(() => {
    // Only clear if the active chat belongs to this project
    if (currentChatBelongsToProject && activeChatId && projectChatsRecord[activeChatId]) {
      setAiAssistantPanel({
        sqlSnippets: [],
        initialInput: '',
        chats: {
          ...chats,
          [activeChatId]: {
            ...projectChatsRecord[activeChatId],
            messages: [],
            updatedAt: new Date(),
          },
        } as any,
      })
    }
  }, [activeChatId, projectChatsRecord])

  const handleSaveMessage = useCallback(
    (message: MessageType | MessageType[]) => {
      if (projectRef && currentChatBelongsToProject && activeChatId) {
        // Get the existing messages for the active chat
        const existingMessages: readonly MessageType[] =
          projectChatsRecord[activeChatId]?.messages || []

        // Convert single message to array for consistent handling
        const messagesToAdd = Array.isArray(message)
          ? message.filter((msg) => !existingMessages.some((existing) => existing.id === msg.id))
          : !existingMessages.some((existing) => existing.id === message.id)
            ? [message]
            : []

        if (messagesToAdd.length > 0) {
          const chatUpdate = {
            chats: {
              ...chats,
              [activeChatId]: {
                ...projectChatsRecord[activeChatId],
                messages: [...existingMessages, ...messagesToAdd],
                updatedAt: new Date(),
              },
            },
          }
          setAiAssistantPanel({
            chats: chatUpdate.chats as Record<string, ChatSession>,
          })
        }
      }
    },
    [activeChatId, projectChatsRecord]
  )

  const openAssistant = useCallback(
    (options?: Partial<typeof aiAssistantPanel>) => {
      // If opening the assistant, ensure we have a valid project chat
      const updatedOptions = { ...options }

      if (projectRef) {
        // If we're opening with a specific chat ID, make sure it belongs to this project
        if (updatedOptions.activeChatId && !projectChatsRecord[updatedOptions.activeChatId]) {
          // If not, find the first available project chat or create a new one
          const projectChatIds = Object.keys(projectChatsRecord)
          if (projectChatIds.length > 0) {
            updatedOptions.activeChatId = projectChatIds[0]
          } else {
            // No chats for this project, we'll create one when the assistant opens
            delete updatedOptions.activeChatId
          }
        }
      }

      setAiAssistantPanel({ open: true, ...updatedOptions } as any)

      // If we opened without a valid project chat, create one
      if (
        projectRef &&
        !updatedOptions.activeChatId &&
        Object.keys(projectChatsRecord).length === 0
      ) {
        handleNewChat()
      }
    },
    [projectRef]
  )

  const closeAssistant = useCallback(() => {
    setAiAssistantPanel({ open: false })
  }, [setAiAssistantPanel])

  const clearSqlSnippets = useCallback(() => {
    setAiAssistantPanel({ sqlSnippets: undefined })
  }, [setAiAssistantPanel])

  const clearSuggestions = useCallback(() => {
    setAiAssistantPanel({ suggestions: undefined })
  }, [setAiAssistantPanel])

  const setSqlSnippets = useCallback(
    (snippets: string[]) => {
      setAiAssistantPanel({ sqlSnippets: snippets })
    },
    [setAiAssistantPanel]
  )

  return {
    // State
    chats: projectChatEntries,
    activeChatId,
    activeChat:
      currentChatBelongsToProject && activeChatId ? projectChatsRecord[activeChatId] : undefined,
    isOpen: open,
    messages: projectChatsRecord[activeChatId || 'default']?.messages as Message[],

    // Actions
    newChat: handleNewChat,
    selectChat: handleSelectChat,
    deleteChat: handleDeleteChat,
    renameChat: handleRenameChat,
    clearMessages: handleClearMessages,
    saveMessage: handleSaveMessage,
    openAssistant,
    closeAssistant,
    clearSqlSnippets,
    clearSuggestions,
    setSqlSnippets,
  }
}
