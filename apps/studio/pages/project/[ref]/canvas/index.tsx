import React, { useState, useRef, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { create } from 'zustand'
import { Rnd } from 'react-rnd'
import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Minus, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { SqlCard } from 'components/ui/AIAssistantPanel/SqlSnippet'
import type { NextPageWithLayout } from 'types'

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

interface CanvasStore {
  items: DraggedItem[]
  addItem: (item: DraggedItem) => void
  updateItemPosition: (id: number, x: number, y: number) => void
  updateItemSize: (id: number, width: number, height: number) => void
}

const useCanvasStore = create<CanvasStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItemPosition: (id, x, y) =>
    set((state) => ({
      items: state.items.map((item) => (item.props.id === id ? { ...item, x, y } : item)),
    })),
  updateItemSize: (id, width, height) =>
    set((state) => ({
      items: state.items.map((item) => (item.props.id === id ? { ...item, width, height } : item)),
    })),
}))

const DraggableItem: React.FC<{ id: number; props: Record<string, any> }> = ({ id, props }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, props }))
  }

  return (
    <div draggable onDragStart={handleDragStart} className="cursor-move">
      <Button variant="outline">Drag Me (ID: {id})</Button>
    </div>
  )
}

const Canvas: React.FC = () => {
  const items = useCanvasStore((state) => state.items)
  const addItem = useCanvasStore((state) => state.addItem)
  const updateItemPosition = useCanvasStore((state) => state.updateItemPosition)
  const updateItemSize = useCanvasStore((state) => state.updateItemSize)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    addItem({ ...data, x, y, width: 400, height: 150 })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  console.log('drag items:', items)

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full h-full border-2 border-dashed border-gray-300 relative overflow-hidden"
    >
      {items.map((item) => (
        <Rnd
          className="bg shadow rounded-lg overflow-hidden"
          key={item.props.id}
          position={{ x: item.x, y: item.y }}
          size={{ width: item.width, height: item.height }}
          onDragStop={(e, d) => {
            updateItemPosition(item.props.id, d.x, d.y)
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            updateItemSize(item.props.id, parseFloat(ref.style.width), parseFloat(ref.style.height))
            updateItemPosition(item.props.id, position.x, position.y)
          }}
        >
          <SqlCard {...item.props} />
        </Rnd>
      ))}
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
