import { Filter, Plus } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'ui'

interface TextSelectionPopupProps {
  selectedText: string
  position: { x: number; y: number }
  onAddToSearch: (text: string) => void
  onFilterOut: (text: string) => void
  onClose: () => void
  setPopupRef: (ref: HTMLElement | null) => void
}

export const TextSelectionPopup = ({
  selectedText,
  position,
  onAddToSearch,
  onFilterOut,
  onClose,
  setPopupRef,
}: TextSelectionPopupProps) => {
  const localRef = useRef<HTMLDivElement | null>(null)

  const popupRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node
      setPopupRef(node)
    },
    [setPopupRef]
  )

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const handleScroll = () => {
      onClose()
    }

    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  const handleAddToSearch = () => {
    onAddToSearch(selectedText)
    onClose()
  }

  const handleFilterOut = () => {
    onFilterOut(selectedText)
    onClose()
  }

  // Truncate very long selections for display
  const displayText = selectedText.length > 30 ? `${selectedText.slice(0, 30)}...` : selectedText

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-50 gap-2 rounded-lg border bg-surface-100 shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(8px, -50%)',
      }}
    >
      <div className="text-xs text-foreground-light px-2 max-w-[200px] truncate p-2 font-mono tracking-tight">
        {displayText}
      </div>
      <div className="p-1 border-t">
        <Button
          type="text"
          size="tiny"
          icon={<Plus size={14} />}
          onClick={handleAddToSearch}
          title="Filter by text"
        >
          Filter
        </Button>
        <Button
          type="text"
          size="tiny"
          icon={<Filter size={14} />}
          onClick={handleFilterOut}
          title="Exclude from results"
        >
          Exclude
        </Button>
      </div>
    </div>,
    document.body
  )
}
