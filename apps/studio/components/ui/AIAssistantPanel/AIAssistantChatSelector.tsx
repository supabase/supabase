import { Check, Edit, History, MoreVertical, Plus, Trash, X } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Menu,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

import { ShortcutTooltip } from '../ShortcutTooltip'
import ProductMenuBar from '@/components/layouts/Navigation/ProductMenuBar'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface AIAssistantChatSelectorProps {
  disabled?: boolean
}

export const AIAssistantChatSelector = ({ disabled = false }: AIAssistantChatSelectorProps) => {
  const snap = useAiAssistantStateSnapshot()
  const { isMaximised } = useSidebarManagerSnapshot()

  const [chatSelectorOpen, setChatSelectorOpen] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingChatName, setEditingChatName] = useState('')

  const chats = Object.entries(snap.chats)

  useShortcut(
    SHORTCUT_IDS.AI_ASSISTANT_TOGGLE_HISTORY,
    () => setChatSelectorOpen((prev) => !prev),
    { enabled: !isMaximised }
  )

  const handleSelectChat = (id: string) => {
    snap.selectChat(id)
    setChatSelectorOpen(false)
  }

  const handleDeleteChat = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    snap.deleteChat(id)
  }

  const handleStartEditChat = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingChatId(id)
    setEditingChatName(name)
  }

  const handleSaveEditChat = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (editingChatId && editingChatName.trim()) {
      snap.renameChat(editingChatId, editingChatName.trim())
      setEditingChatId(null)
      setEditingChatName('')
    }
  }

  const handleCancelEditChat = (e?: React.MouseEvent | React.FocusEvent) => {
    if (e) e.stopPropagation()
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
      <ShortcutTooltip
        side="bottom"
        label="History"
        shortcutId={SHORTCUT_IDS.AI_ASSISTANT_TOGGLE_HISTORY}
      >
        <PopoverTrigger asChild>
          <Button
            aria-label="History"
            variant="text"
            size="tiny"
            className="h-7 w-7 p-0"
            icon={<History />}
          />
        </PopoverTrigger>
      </ShortcutTooltip>
      <PopoverContent className="w-[250px] p-0" align="end">
        <Command>
          <CommandInput className="text-xs" placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className={chats.length > 4 ? 'h-40' : ''}>
                {/* @ts-ignore */}
                {chats.map(([id, chat]) => (
                  <CommandItem
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
                          <Input
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
                              aria-label="Save chat name"
                              variant="text"
                              size="tiny"
                              icon={<Check size={14} />}
                              onClick={(e) => handleSaveEditChat(e)}
                              className="h-7 w-7"
                            />
                            <Button
                              aria-label="Cancel edit chat"
                              variant="text"
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
                              'mr-2 h-4 w-4 shrink-0',
                              snap.activeChatId === id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="truncate flex-1 w-0">{chat.name}</span>
                        </>
                      )}
                    </div>
                    {editingChatId !== id && (
                      <div className="flex items-center gap-x-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          aria-label="Edit chat name"
                          variant="text"
                          size="tiny"
                          icon={<Edit size={14} />}
                          onClick={(e) => handleStartEditChat(id, chat.name, e)}
                          className="h-6 w-6"
                        />
                        {chats.length > 1 && (
                          <Button
                            aria-label="Delete chat"
                            variant="text"
                            size="tiny"
                            icon={<Trash size={14} />}
                            onClick={(e) => handleDeleteChat(id, e)}
                            className="h-6 w-6"
                          />
                        )}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
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
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const AIAssistantChatMenu = () => {
  const snap = useAiAssistantStateSnapshot()
  const chats = Object.entries(snap.chats)

  const [value, setValue] = useState<string>()
  const [editingId, setEditingId] = useState<string>()

  const handleSaveName = (id: string) => {
    if (value?.trim()) snap.renameChat(id, value.trim())
    setEditingId(undefined)
  }

  const handleKeyDownInput = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setEditingId(undefined)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveName(id)
    }
  }

  return (
    <div className="flex flex-col border-r w-64 [&>div]:bg-transparent">
      <ProductMenuBar title="AI Assistant">
        <Menu type="pills">
          <Menu.Group
            title={
              <div className="flex w-full items-center justify-between relative mt-4 px-3">
                <span className="uppercase font-mono">Chats</span>
              </div>
            }
          />
          <div className="px-3 pb-2">
            {chats.map(([id, chat]) => (
              <Menu.Item
                key={id}
                active={snap.activeChatId === id}
                className={cn('group', editingId === id ? 'p-0' : 'pl-3 pr-1')}
                onClick={() => snap.selectChat(id)}
              >
                {editingId === id ? (
                  <Input
                    autoFocus
                    size="tiny"
                    value={value}
                    className="ring-0! focus-visible:ring-offset-0 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => handleSaveName(id)}
                    onKeyDown={(e) => handleKeyDownInput(e, id)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="truncate w-full">{chat.name}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="More actions"
                          variant="text"
                          className="px-0.5 h-[20px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                          icon={<MoreVertical size={12} strokeWidth={2} />}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 *:gap-x-2">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditingId(id)
                            setValue(chat.name)
                          }}
                        >
                          <Edit size={12} />
                          <div>Rename</div>
                        </DropdownMenuItem>
                        {chats.length > 1 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                snap.deleteChat(id)
                              }}
                            >
                              <Trash size={12} />
                              <div>Delete</div>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu>
      </ProductMenuBar>
    </div>
  )
}
