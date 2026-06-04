'use client'

import { useEffect } from 'react'

import { useDocsAiSidebarOptional } from './DocsAiSidebarContext'

function DocsAiSidebarShortcut() {
  const sidebar = useDocsAiSidebarOptional()
  const isOpen = sidebar?.isOpen
  const open = sidebar?.open
  const close = sidebar?.close

  useEffect(() => {
    if (!open || !close) return

    const handleKeydown = (event: KeyboardEvent) => {
      const usesPrimaryModifier = event.metaKey || event.ctrlKey
      const otherModifiersActive = event.altKey || event.shiftKey

      if (event.key.toLowerCase() !== 'j' || !usesPrimaryModifier || otherModifiersActive) {
        return
      }

      event.preventDefault()

      if (isOpen) {
        close()
      } else {
        open()
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isOpen, open, close])

  return null
}

export { DocsAiSidebarShortcut }
