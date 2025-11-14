import { Check, ChevronDown, Edit, Plus, Trash, X } from 'lucide-react'
import { useState } from 'react'

import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

interface AIAssistantChatSelectorProps {
  disabled?: boolean
}

export const AIAssistantChatSelector = ({ disabled = false }: AIAssistantChatSelectorProps) => {
  const snap = useAiAssistantStateSnapshot()
  const currentChat = snap.activeChat?.name

  const [chatSelectorOpen, setChatSelectorOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatName, setEditingChatName] = useState('')

  const chats = Object.entries(snap.chats)

  const handleSelectChat = (id: string) => {
    snap.selectChat(id)
    setChatSelectorOpen(false)
  }

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    snap.deleteChat(id)
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
    if (editingChatId && editingChatName.trim()) {
      snap.renameChat(editingChatId, editingChatName.trim())
      setEditingChatId(null)
      setEditingChatName('')
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

  return (
    <Popover open={chatSelectorOpen} onOpenChange={setChatSelectorOpen}>
      <PopoverTrigger asChild>
        <Button
          type="text"
          size="tiny"
          iconRight={<ChevronDown size={14} />}
          className="max-w-64 truncate"
        >
          {currentChat}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search chats..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No chats found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className={chats.length > 4 ? 'h-40' : ''}>
                {/* @ts-ignore */}
                {chats.map(([id, chat]) => (
                  <CommandItem_Shadcn_
                    key={id}
                    value={id}
                    onSelect={() => handleSelectChat(id)}
                    className="flex items-center justify-between gap-2 py-1 w-full overflow-hidden group"
                    keywords={!!chat.name ? [chat.name] : undefined}
                    disabled={disabled}
                  >
                    <div className="flex items-center w-full flex-1 min-w-0">
                      {editingChatId === id ? (
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
                              snap.activeChatId === id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="truncate flex-1 min-w-0 overflow-hidden">
                            {chat.name}
                          </span>
                        </>
                      )}
                    </div>
                    {editingChatId !== id && (
                      <div className="flex items-center gap-x-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="text"
                          size="tiny"
                          icon={<Edit size={14} />}
                          onClick={(e) => handleStartEditChat(id, chat.name, e)}
                          className="h-6 w-6"
                        />
                        {chats.length > 1 && (
                          <Button
                            type="text"
                            size="tiny"
                            icon={<Trash size={14} />}
                            onClick={(e) => handleDeleteChat(id, e)}
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
                onSelect={() => {
                  snap.newChat()
                  setChatSelectorOpen(false)
                }}
                onClick={() => {
                  snap.newChat()
                  setChatSelectorOpen(false)
                }}
                disabled={disabled}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Start a new chat</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent>
    </Popover>
  )
}
