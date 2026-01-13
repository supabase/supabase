'use client'

import { Cursor } from '@/registry/default/blocks/realtime-cursor/components/cursor'
import { useRealtimeCursors } from '@/registry/default/blocks/realtime-cursor/hooks/use-realtime-cursors'

const THROTTLE_MS = 50

export const RealtimeCursors = ({ roomName, username }: { roomName: string; username: string }) => {
  const { cursors } = useRealtimeCursors({ roomName, username, throttleMs: THROTTLE_MS })

  return (
    <div>
      {Object.keys(cursors).map((id) => (
        <Cursor
          key={id}
          className="fixed transition-transform ease-in-out z-50"
          style={{
            transitionDuration: '20ms',
            top: 0,
            left: 0,
            transform: `translate(${cursors[id].position.x}px, ${cursors[id].position.y}px)`,
          }}
          color={cursors[id].color}
          name={cursors[id].user.name}
        />
      ))}
    </div>
  )
}
