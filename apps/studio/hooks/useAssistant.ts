import { Message as MessageType } from 'ai/react'
import { useCallback } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { ChatSession } from 'state/app-state'

export interface UseAssistantOptions {
  projectRef?: string
}

export function useAssistant(options?: UseAssistantOptions) {
  const { projectRef } = options || {}
  const { aiAssistantPanel, setAiAssistantPanel } = useAppStateSnapshot()

  const { chats, activeChatId, open, messages } = aiAssistantPanel

  // Get chat entries that match the current project
  const projectChats = Object.entries(chats || {}).filter(
    ([_, chat]) => chat.projectRef === projectRef
  )

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
        messages: [],
        chats: {
          ...(aiAssistantPanel.chats || {}),
          [chatId]: newChat,
        } as any,
        activeChatId: chatId,
      })

      return chatId
    }
    return undefined
  }, [projectRef, aiAssistantPanel.chats, setAiAssistantPanel])

  const handleSelectChat = useCallback(
    (id: string) => {
      const chat = chats?.[id]
      if (chat) {
        // Check if this is already the active chat and messages are the same
        if (id === activeChatId) {
          // If it's already the active chat, no need to update state
          return
        }

        // Create a new array from the messages to avoid readonly issues
        const messagesCopy = chat.messages ? [...chat.messages] : []

        // Check if the messages are different from the current ones
        const currentMessagesJson = JSON.stringify(aiAssistantPanel.messages || [])
        const newMessagesJson = JSON.stringify(messagesCopy)

        if (id !== activeChatId || currentMessagesJson !== newMessagesJson) {
          setAiAssistantPanel({
            messages: messagesCopy as any,
            activeChatId: id,
          })
        }
      }
    },
    [chats, setAiAssistantPanel, activeChatId, aiAssistantPanel.messages]
  )

  const handleDeleteChat = useCallback(
    (id: string) => {
      const { [id]: _, ...remainingChats } = chats || {}

      // If deleting the active chat, set active to undefined or the first available chat
      let newActiveChatId = activeChatId
      if (newActiveChatId === id) {
        const chatIds = Object.keys(remainingChats)
        newActiveChatId = chatIds.length > 0 ? chatIds[0] : undefined
      }

      // Create a new array from the messages to avoid readonly issues
      const messagesCopy =
        newActiveChatId && remainingChats[newActiveChatId]?.messages
          ? [...remainingChats[newActiveChatId].messages]
          : []

      setAiAssistantPanel({
        messages: messagesCopy as any,
        chats: remainingChats as any,
        activeChatId: newActiveChatId,
      })
    },
    [chats, activeChatId, setAiAssistantPanel]
  )

  const handleRenameChat = useCallback(
    (id: string, name: string) => {
      const chat = chats?.[id]
      if (chat) {
        setAiAssistantPanel({
          chats: {
            ...chats,
            [id]: {
              ...chat,
              name,
              updatedAt: new Date(),
            },
          } as any,
        })
      }
    },
    [chats, setAiAssistantPanel]
  )

  const handleClearMessages = useCallback(() => {
    if (activeChatId && chats && chats[activeChatId]) {
      setAiAssistantPanel({
        messages: [],
        chats: {
          ...chats,
          [activeChatId]: {
            ...chats[activeChatId],
            messages: [],
            updatedAt: new Date(),
          },
        } as any,
      })
    }
  }, [activeChatId, chats, setAiAssistantPanel])

  const handleSaveMessage = useCallback(
    (message: MessageType) => {
      // Create a function to safely copy messages and add a new one
      function safeAddMessage(existingMessages: any, newMessage: MessageType): any {
        if (!existingMessages || !Array.isArray(existingMessages)) {
          return [newMessage]
        }

        // Check if the message already exists to avoid duplicates
        const messageExists = existingMessages.some(
          (msg) =>
            msg.id === newMessage.id ||
            (msg.content === newMessage.content && msg.role === newMessage.role)
        )

        if (messageExists) {
          return existingMessages
        }

        return [...existingMessages, newMessage]
      }

      if (activeChatId && chats && chats[activeChatId]) {
        // Get existing messages
        const existingChatMessages = chats[activeChatId].messages
        const existingAppMessages = aiAssistantPanel.messages

        // Create new message arrays
        const newChatMessages = safeAddMessage(existingChatMessages, message)
        const newAppMessages = safeAddMessage(existingAppMessages, message)

        // Only update if messages have changed
        const chatMessagesChanged = newChatMessages.length !== existingChatMessages.length
        const appMessagesChanged = newAppMessages.length !== existingAppMessages.length

        if (chatMessagesChanged || appMessagesChanged) {
          // Update the active chat with the new message
          const updatedChat = {
            ...chats[activeChatId],
            messages: newChatMessages,
            updatedAt: new Date(),
          }

          setAiAssistantPanel({
            messages: newAppMessages,
            chats: {
              ...chats,
              [activeChatId]: updatedChat,
            } as any,
          })
        }
      } else {
        // Fallback to old behavior if no active chat
        const newMessages = safeAddMessage(aiAssistantPanel.messages, message)

        // Only update if messages have changed
        if (newMessages.length !== aiAssistantPanel.messages.length) {
          setAiAssistantPanel({
            messages: newMessages,
          })
        }
      }
    },
    [activeChatId, chats, aiAssistantPanel.messages, setAiAssistantPanel]
  )

  const openAssistant = useCallback(
    (
      options?: Partial<Omit<typeof aiAssistantPanel, 'messages'>> & { messages?: MessageType[] }
    ) => {
      setAiAssistantPanel({ open: true, ...options } as any)
    },
    [setAiAssistantPanel]
  )

  const closeAssistant = useCallback(() => {
    setAiAssistantPanel({ open: false })
  }, [setAiAssistantPanel])

  return {
    // State
    chats,
    projectChats,
    activeChatId,
    activeChat: activeChatId ? chats[activeChatId] : undefined,
    isOpen: open,
    messages,

    // Actions
    newChat: handleNewChat,
    selectChat: handleSelectChat,
    deleteChat: handleDeleteChat,
    renameChat: handleRenameChat,
    clearMessages: handleClearMessages,
    saveMessage: handleSaveMessage,
    openAssistant,
    closeAssistant,
  }
}
