'use client'

import { memo, useSyncExternalStore } from 'react'

import { Cursor } from './Cursor'
import type { CursorStore } from './cursorStore'

type RealtimeCursorLayerProps = {
  store: CursorStore
}

function RealtimeCursorLayerInner({ store }: RealtimeCursorLayerProps) {
  const cursors = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {Object.values(cursors).map((cursor) => (
        <Cursor
          key={cursor.user.id}
          className="absolute transition-transform ease-linear duration-[20ms]"
          style={{
            top: 0,
            left: 0,
            transform: `translate3d(${cursor.position.x}px, ${cursor.position.y}px, 0)`,
          }}
          color={cursor.color}
          name={cursor.user.name}
        />
      ))}
    </div>
  )
}

export const RealtimeCursorLayer = memo(RealtimeCursorLayerInner)
