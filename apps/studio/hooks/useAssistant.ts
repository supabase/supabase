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
  }, [
    projectRef,
    currentChatBelongsToProject,
    activeChatId,
    projectChatsRecord,
    setAiAssistantPanel,
    aiAssistantPanel.chats,
  ])

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
  }, [projectRef, setAiAssistantPanel])

  const handleSelectChat = useCallback(
    (id: string) => {
      if (projectRef && chats && id in chats) {
        const chat = projectChatsRecord[id]
        if (chat) {
          // Check if this is already the active chat
          if (id === activeChatId) {
            // If it's already the active chat, no need to update state
            return
          }

          setAiAssistantPanel({
            activeChatId: id,
          })
        }
      }
    },
    [activeChatId, chats, projectChatsRecord, projectRef, setAiAssistantPanel]
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
        // Use the direct state update approach instead of functional update
        // to avoid TypeScript errors with the state updater function
        const updatedChats = { ...chats }
        if (updatedChats[id]) {
          updatedChats[id] = {
            ...updatedChats[id],
            name,
            updatedAt: new Date(),
          }

          setAiAssistantPanel({
            chats: updatedChats as any,
          })
        }
      }
    },
    [chats, projectChatsRecord, setAiAssistantPanel]
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
  }, [activeChatId, chats, currentChatBelongsToProject, projectChatsRecord, setAiAssistantPanel])

  const handleSaveMessage = useCallback(
    (message: MessageType) => {
      if (projectRef && currentChatBelongsToProject && activeChatId) {
        // Get the existing messages for the active chat
        const existingMessages = projectChatsRecord[activeChatId]?.messages || []
        const messageExists = existingMessages.some(
          (msg: any) =>
            msg.id === message.id || (msg.content === message.content && msg.role === message.role)
        )

        if (!messageExists) {
          const newMessages = [...existingMessages, message]

          // Update chat messages
          setAiAssistantPanel({
            chats: {
              ...chats,
              [activeChatId]: {
                ...projectChatsRecord[activeChatId],
                messages: newMessages,
                updatedAt: new Date(),
              },
            } as any,
          })
        }
      }
    },
    [
      chats,
      activeChatId,
      currentChatBelongsToProject,
      projectRef,
      projectChatsRecord,
      setAiAssistantPanel,
    ]
  )

  const handleSaveMessages = useCallback(
    (messages: MessageType[]) => {
      if (projectRef && currentChatBelongsToProject && activeChatId) {
        // Get the current messages to compare
        const currentMessages = projectChatsRecord[activeChatId]?.messages || []

        // Check if the messages array is actually different before updating
        // This prevents circular updates
        if (JSON.stringify(currentMessages) !== JSON.stringify(messages)) {
          // Update chat messages
          setAiAssistantPanel({
            chats: {
              ...chats,
              [activeChatId]: {
                ...projectChatsRecord[activeChatId],
                messages,
                updatedAt: new Date(),
              },
            } as any,
          })
        }
      }
    },
    [
      chats,
      activeChatId,
      currentChatBelongsToProject,
      projectRef,
      projectChatsRecord,
      setAiAssistantPanel,
    ]
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
    [projectRef, setAiAssistantPanel, handleNewChat]
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
    messages: (currentChatBelongsToProject && activeChatId
      ? projectChatsRecord[activeChatId]?.messages || []
      : chats?.[activeChatId || 'default']?.messages || []) as Message[],

    // Actions
    newChat: handleNewChat,
    selectChat: handleSelectChat,
    deleteChat: handleDeleteChat,
    renameChat: handleRenameChat,
    clearMessages: handleClearMessages,
    saveMessage: handleSaveMessage,
    saveMessages: handleSaveMessages,
    openAssistant,
    closeAssistant,
    clearSqlSnippets,
    clearSuggestions,
    setSqlSnippets,
  }
}
