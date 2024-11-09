import { useActionKey } from 'hooks/useActionKey'
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { sidebarOpenAtom } from '../tabs/sidebar-state'

interface MenuBarWrapperProps {
  isLoading: boolean
  isBlocking: boolean
  productMenu: React.ReactNode
  children: React.ReactNode
}

export function MenuBarWrapper({
  isLoading,
  isBlocking,
  productMenu,
  children,
}: MenuBarWrapperProps) {
  const actionKey = useActionKey()
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(sidebarOpenAtom)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsSidebarOpen])

  // ... rest of component
}
