'use client'

import { Cursor } from '@/registry/default/blocks/realtime-cursor/components/cursor'
import { useRealtimeCursors } from '@/registry/default/blocks/realtime-cursor/hooks/use-realtime-cursors'

export const RealtimeCursors = ({ roomName, username }: { roomName: string; username: string }) => {
  const { cursors } = useRealtimeCursors({ roomName, username })

  return (
    <div>
      {Object.keys(cursors).map((id) => (
        <Cursor
          key={id}
          className="fixed ease-linear duration-70 z-50"
          style={{
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
