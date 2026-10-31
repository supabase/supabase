import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from 'ui'

export type RowOptionChild = { name: string; onClick: () => void }
export type RowOption = {
  name: string
  icon?: ReactNode
  onClick?: () => void
  children?: RowOptionChild[]
}

type FileExplorerContextMenuContextValue = {
  onRowContextMenu: (e: React.MouseEvent, options: RowOption[]) => void
}

const FileExplorerContextMenuContext = createContext<FileExplorerContextMenuContextValue | null>(
  null
)

export function useFileExplorerContextMenu() {
  return useContext(FileExplorerContextMenuContext)
}

/**
 * Context provider for the file explorer row context menu. This allows us to reuse a single context menu and event handlers.
 */
export function FileExplorerRowContextMenuProvider({ children }: { children: ReactNode }) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [contextMenuKey, setContextMenuKey] = useState(0)
  const [activeOptions, setActiveOptions] = useState<RowOption[]>([])

  const onRowContextMenu = useCallback((e: React.MouseEvent, options: RowOption[]) => {
    e.preventDefault()
    setActiveOptions(options)
    setContextMenuKey((prev) => prev + 1)
    const trigger = triggerRef.current
    if (!trigger) return
    trigger.style.left = `${e.clientX}px`
    trigger.style.top = `${e.clientY}px`
    trigger.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    )
  }, [])

  return (
    <FileExplorerContextMenuContext.Provider value={{ onRowContextMenu }}>
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>
          <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
        </ContextMenuTrigger>
        <ContextMenuContent
          key={contextMenuKey}
          onCloseAutoFocus={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {activeOptions.map((option) => {
            if ((option.children ?? []).length > 0) {
              return (
                <ContextMenuSub key={option.name}>
                  <ContextMenuSubTrigger className="gap-x-2">
                    {option.icon || <></>}
                    <span className="text-xs">{option.name}</span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {(option.children ?? []).map((child) => (
                      <ContextMenuItem key={child.name} onSelect={child.onClick}>
                        <span className="text-xs">{child.name}</span>
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )
            } else if (option.name === 'Separator') {
              return <ContextMenuSeparator key={option.name} />
            } else {
              return (
                <ContextMenuItem className="gap-x-2" key={option.name} onSelect={option.onClick}>
                  {option.icon || <></>}
                  <span className="text-xs">{option.name}</span>
                </ContextMenuItem>
              )
            }
          })}
        </ContextMenuContent>
      </ContextMenu>
      {children}
    </FileExplorerContextMenuContext.Provider>
  )
}
