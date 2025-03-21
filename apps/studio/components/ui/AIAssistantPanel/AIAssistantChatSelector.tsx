import { useState } from 'react'
import { Check, Edit, MessageSquare, Trash, X } from 'lucide-react'
import { useAssistant } from 'hooks/useAssistant'
import { useRouter } from 'next/router'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

interface AIAssistantChatSelectorProps {
  className?: string
}

export const AIAssistantChatSelector = ({ className }: AIAssistantChatSelectorProps) => {
  const router = useRouter()
  const projectRef = typeof router.query.ref === 'string' ? router.query.ref : undefined
  const { chats, activeChatId, selectChat, deleteChat, renameChat } = useAssistant({
    projectRef,
  })

  const [chatSelectorOpen, setChatSelectorOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatName, setEditingChatName] = useState('')

  const handleSelectChat = (id: string) => {
    selectChat(id)
    setChatSelectorOpen(false)
  }

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    deleteChat(id)
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
      renameChat(editingChatId, editingChatName.trim())
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
    <Popover_Shadcn_ open={chatSelectorOpen} onOpenChange={setChatSelectorOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="default"
          size="tiny"
          icon={<MessageSquare size={14} />}
          className={cn('h-7 w-7', className)}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[250px] p-0" align="end">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search chats..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No chats found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {chats.map(([id, chat]) => (
                <CommandItem_Shadcn_
                  key={id}
                  value={id}
                  onSelect={() => handleSelectChat(id)}
                  className="flex items-center justify-between gap-2 py-1 w-full overflow-hidden group"
                  keywords={[chat.name]}
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
                            activeChatId === id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate flex-1 min-w-0 overflow-hidden">{chat.name}</span>
                      </>
                    )}
                  </div>
                  {editingChatId !== id && (
                    <div className="flex items-center gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="text"
                        size="tiny"
                        icon={<Edit size={14} />}
                        onClick={(e) => handleStartEditChat(id, chat.name, e)}
                        className="h-7 w-7"
                      />
                      <Button
                        type="text"
                        size="tiny"
                        icon={<Trash size={14} />}
                        onClick={(e) => handleDeleteChat(id, e)}
                        className="h-7 w-7"
                      />
                    </div>
                  )}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
