import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from 'ui'
import { useSnapshot } from 'valtio'
import { sidebarState } from '../tabs/sidebar-state'

export function CollapseButton({ hideTabs }: { hideTabs: boolean }) {
  const sidebar = useSnapshot(sidebarState)

  useEffect(() => {
    console.log('Component mounted, adding event listener') // Check if this runs

    function handleKeyDown(event: KeyboardEvent) {
      console.log('event', event)
      if (event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey)) {
        console.log('event.key', event.key)
        event.preventDefault()
        sidebarState.isOpen = !sidebarState.isOpen
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      console.log('Component unmounting, removing listener') // Check cleanup
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <button
      className={cn(
        'flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0',
        !hideTabs && 'border-r'
      )}
      onClick={() => (sidebarState.isOpen = !sidebar.isOpen)}
    >
      {sidebar.isOpen ? (
        <PanelLeftClose
          size={16}
          strokeWidth={1.5}
          className="text-foreground-lighter hover:text-foreground-light"
        />
      ) : (
        <PanelLeftOpen
          size={16}
          strokeWidth={1.5}
          className="text-foreground-lighter hover:text-foreground-light"
        />
      )}
    </button>
  )
}
