import { Check, ChevronDown, Edit, Plus, Trash, X } from 'lucide-react'
import { useState } from 'react'

import { useAgentCreateMutation } from 'data/agents/agent-create-mutation'
import { useAgentDeleteMutation } from 'data/agents/agent-delete-mutation'
import { useAgentUpdateMutation } from 'data/agents/agent-update-mutation'
import { useAgentsQuery } from 'data/agents/agents-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useAiAssistantState, useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'

interface AIAssistantChatSelectorProps {
  disabled?: boolean
}

export const AIAssistantChatSelector = ({ disabled = false }: AIAssistantChatSelectorProps) => {
  const { data: project } = useSelectedProjectQuery()
  const snap = useAiAssistantStateSnapshot()
  const state = useAiAssistantState()

  const shouldFetchSessions = IS_PLATFORM && !!project?.ref

  // Fetch chats from server
  const { data: sessions = [] } = useAgentsQuery(
    { projectRef: project?.ref },
    { enabled: shouldFetchSessions && !disabled, retry: false }
  )

  // Mutations
  const createSession = useAgentCreateMutation()
  const updateSession = useAgentUpdateMutation()
  const deleteSession = useAgentDeleteMutation()

  const [chatSelectorOpen, setChatSelectorOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatName, setEditingChatName] = useState('')

  // Find current chat
  const currentChat = sessions.find((s) => s.id === snap.activeChatId)

  const handleSelectChat = (id: string) => {
    state.setActiveChatId(id)
    setChatSelectorOpen(false)
  }

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (!project?.ref) return

    deleteSession.mutate(
      { id, projectRef: project.ref },
      {
        onSuccess: () => {
          // If deleting the active chat, switch to another one
          if (id === snap.activeChatId && sessions.length > 1) {
            const remainingSessions = sessions.filter((s) => s.id !== id)
            if (remainingSessions.length > 0) {
              state.setActiveChatId(remainingSessions[0].id)
            }
          }
        },
      }
    )
  }

  const handleStartEditChat = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setEditingChatId(id)
    setEditingChatName(name)
  }

  const handleSaveEditChat = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (editingChatId && editingChatName.trim() && project?.ref) {
      updateSession.mutate(
        {
          id: editingChatId,
          name: editingChatName.trim(),
          projectRef: project.ref,
        },
        {
          onSuccess: () => {
            setEditingChatId(null)
            setEditingChatName('')
          },
        }
      )
    }
  }

  const handleCancelEditChat = (e?: React.MouseEvent | React.FocusEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setEditingChatId(null)
    setEditingChatName('')
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    e.stopPropagation()
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const isSaveOrCancelButton = relatedTarget?.closest('button')

    if (!isSaveOrCancelButton && editingChatId && editingChatName.trim()) {
      handleSaveEditChat()
    } else if (!isSaveOrCancelButton) {
      handleCancelEditChat(e)
    }
  }

  const handleNewChat = () => {
    if (!project?.ref) return

    createSession.mutate(
      { projectRef: project.ref },
      {
        onSuccess: (newSession) => {
          state.setActiveChatId(newSession.id)
          setChatSelectorOpen(false)
        },
      }
    )
  }

  return (
    <Popover_Shadcn_ open={chatSelectorOpen} onOpenChange={setChatSelectorOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          size="tiny"
          iconRight={<ChevronDown size={14} />}
          className="max-w-64 truncate"
        >
          {currentChat?.name || 'New chat'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[250px] p-0" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search chats..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No chats found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className={sessions.length > 4 ? 'h-40' : ''}>
                {sessions.map((session) => (
                  <CommandItem_Shadcn_
                    key={session.id}
                    value={session.id}
                    onSelect={() => handleSelectChat(session.id)}
                    className="flex items-center justify-between gap-2 py-1 w-full overflow-hidden group"
                    keywords={session.name ? [session.name] : undefined}
                    disabled={disabled}
                  >
                    <div className="flex items-center w-full flex-1 min-w-0">
                      {editingChatId === session.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input_Shadcn_
                            value={editingChatName}
                            onChange={(e) => setEditingChatName(e.target.value)}
                            autoFocus
                            size="tiny"
                            className="flex-1 w-full"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={handleInputBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.stopPropagation()
                                handleSaveEditChat()
                              } else if (e.key === 'Escape') {
                                e.preventDefault()
                                e.stopPropagation()
                                handleCancelEditChat()
                              }
                            }}
                          />
                          <div className="flex items-center gap-0">
                            <Button
                              type="text"
                              size="tiny"
                              icon={<Check size={14} />}
                              onClick={(e) => handleSaveEditChat(e)}
                              className="h-7 w-7"
                            />
                            <Button
                              type="text"
                              size="tiny"
                              icon={<X size={14} />}
                              onClick={(e) => handleCancelEditChat(e)}
                              className="h-7 w-7"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 flex-shrink-0',
                              snap.activeChatId === session.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="truncate flex-1 min-w-0 overflow-hidden">
                            {session.name}
                          </span>
                        </>
                      )}
                    </div>
                    {editingChatId !== session.id && (
                      <div className="flex items-center gap-x-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="text"
                          size="tiny"
                          icon={<Edit size={14} />}
                          onClick={(e) => handleStartEditChat(session.id, session.name, e)}
                          className="h-6 w-6"
                        />
                        {sessions.length > 1 && (
                          <Button
                            type="text"
                            size="tiny"
                            icon={<Trash size={14} />}
                            onClick={(e) => handleDeleteChat(session.id, e)}
                            className="h-6 w-6"
                          />
                        )}
                      </div>
                    )}
                  </CommandItem_Shadcn_>
                ))}
              </ScrollArea>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_
                className="cursor-pointer w-full gap-x-2"
                onSelect={handleNewChat}
                onClick={handleNewChat}
                disabled={disabled || createSession.isLoading}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Start a new chat</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
