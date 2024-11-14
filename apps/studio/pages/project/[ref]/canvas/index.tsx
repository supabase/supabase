import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation'
import { useParams } from 'common'
import { motion } from 'framer-motion'
import { Button } from 'ui'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { SqlCard } from 'components/ui/AIAssistantPanel/SqlSnippet'
import type { NextPageWithLayout } from 'types'
import { GripVertical } from 'lucide-react'
import {
  useSnippets,
  useSqlEditorV2StateSnapshot,
  getSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import { useSQLSnippetFoldersQuery } from 'data/content/sql-folders-query'
import { useContentIdQuery } from 'data/content/content-id-query'

const CanvasPage: NextPageWithLayout = () => {
  return <Component />
}
CanvasPage.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default CanvasPage

interface DraggedItem {
  id: number
  x: number
  y: number
  width: number
  height: number
  props: Record<string, any>
}

interface ItemWrapperProps {
  item: DraggedItem
  scale: number
  onPositionUpdate: (id: number, x: number, y: number) => void
  onSizeUpdate: (id: number, width: number, height: number) => void
}

const ItemWrapper: React.FC<ItemWrapperProps> = ({
  item,
  scale,
  onPositionUpdate,
  onSizeUpdate,
}) => {
  const { ref } = useParams()
  const [isDragging, setIsDragging] = useState(false)
  const [size, setSize] = useState({ width: item.width, height: item.height })
  const lastPosition = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: item.x, y: item.y })
  const isItemDragging = useRef(false)

  const { data: contentData } = useContentIdQuery({
    projectRef: ref!,
    id: item.id.toString(),
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent text selection
    isItemDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isItemDragging.current) return
    e.preventDefault() // Prevent text selection

    const deltaX = (e.clientX - lastPosition.current.x) / scale
    const deltaY = (e.clientY - lastPosition.current.y) / scale

    setPosition((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    onPositionUpdate(item.id, position.x + deltaX, position.y + deltaY)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isItemDragging.current = false
  }

  if (!contentData) return null

  let formatted = contentData.content.sql
  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)
  const props = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const title = props.title || 'SQL Query'
  formatted = formatted.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()

  const sqlCardProps = {
    sql: formatted,
    title,
    ...props,
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="border max-h-fit bg-gr bg-background-muted shadow-2xl rounded-lg p-1 absolute"
      style={{
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'nw-resize' : 'grab',
        transform: `translate(${position.x}px, ${position.y}px)`,
        userSelect: 'none',
      }}
    >
      <div className="h-full w-full bg rounded-md overflow-hidden border">
        <SqlCard {...sqlCardProps} />
      </div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        whileHover={{ scale: 1.04 }}
        className="text-foreground-lighter hover:text absolute -bottom-3 -right-3 cursor-se-resize"
        onDrag={(_, info) => {
          const newWidth = Math.max(200, size.width + info.delta.x / scale)
          const newHeight = Math.max(100, size.height + info.delta.y / scale)
          setSize({ width: newWidth, height: newHeight })
          onSizeUpdate(item.id, newWidth, newHeight)
        }}
        onDragStart={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragEnd={() => setIsDragging(false)}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.5 0C7.67157 0 7 0.671573 7 1.5V7H1.5C0.671573 7 0 7.67157 0 8.5C0 9.32843 0.671573 10 1.5 10H8.5C9.32843 10 10 9.32843 10 8.5V1.5C10 0.671573 9.32843 0 8.5 0Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>
    </div>
  )
}

const Canvas: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<DraggedItem[]>([])
  const debounceTimer = useRef<NodeJS.Timeout>()
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastPosition = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  useEffect(() => {
    const queryItems = searchParams.get('items')
    if (queryItems) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(queryItems))
        const itemsWithDefaults = parsedItems.map((item: any) => ({
          ...item,
          x: item.x ?? 0,
          y: item.y ?? 0,
          width: item.width ?? 400,
          height: item.height ?? 150,
        }))
        setItems(itemsWithDefaults)
      } catch (error) {
        console.error('Failed to parse items from URL:', error)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (items.length === 0) return

    const queryString = encodeURIComponent(
      JSON.stringify(
        items.map((item) => ({
          id: item.id,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          props: item.props,
        }))
      )
    )

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      router.replace(
        {
          query: { ...router.query, items: queryString },
        },
        undefined,
        { shallow: true }
      )
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [items, router])

  const handlePositionUpdate = useCallback((id: number, x: number, y: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)))
  }, [])

  const handleSizeUpdate = useCallback((id: number, width: number, height: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, width, height } : item)))
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.border')) return
    e.preventDefault()
    isDragging.current = true
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()

    const deltaX = e.clientX - lastPosition.current.x
    const deltaY = e.clientY - lastPosition.current.y

    setPosition((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    lastPosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 4))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.1))
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full -m-4 relative overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ userSelect: 'none' }}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button type="default" onClick={handleZoomIn}>
          +
        </Button>
        <Button type="default" onClick={handleZoomOut}>
          -
        </Button>
      </div>
      <motion.div
        style={{
          scale,
          x: position.x,
          y: position.y,
        }}
        className="origin-center"
      >
        {items.map((item) => (
          <ItemWrapper
            key={item.id}
            item={item}
            scale={scale}
            onPositionUpdate={handlePositionUpdate}
            onSizeUpdate={handleSizeUpdate}
          />
        ))}
      </motion.div>
    </div>
  )
}

function Component() {
  return (
    <div className="p-4 space-y-4 h-full w-full">
      <Canvas />
    </div>
  )
}
