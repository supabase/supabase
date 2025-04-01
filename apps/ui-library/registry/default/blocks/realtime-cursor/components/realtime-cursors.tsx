'use client'

import { Cursor } from '@/registry/default/blocks/realtime-cursor/components/cursor'
import { useRealtimeCursors } from '@/registry/default/blocks/realtime-cursor/hooks/use-realtime-cursors'
import { useEffect, useState } from 'react'

export const RealtimeCursors = ({ roomName, username }: { roomName: string; username: string }) => {
  const { cursors } = useRealtimeCursors({ roomName, username })
  const [lerpedPositions, setLerpedPositions] = useState<Record<string, { x: number; y: number }>>(
    {}
  )

  // Lerp the positions of the cursors
  // This is to smooth out the movement of the cursors
  // and make it feel more natural
  useEffect(() => {
    let animationFrame: number

    const animate = () => {
      setLerpedPositions((prev) => {
        const next: typeof prev = {}

        Object.entries(cursors).forEach(([id, cursor]) => {
          const target = cursor.position
          const current = prev[id] || target
          const smoothing = 0.2 // tweak between 0.1 - 0.3 for feel (lower is smoother)

          next[id] = {
            x: current.x + (target.x - current.x) * smoothing,
            y: current.y + (target.y - current.y) * smoothing,
          }
        })

        return next
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [cursors])

  return (
    <div>
      {Object.entries(lerpedPositions).map(([id, position]) => (
        <Cursor
          key={id}
          className="fixed ease-linear duration-70 z-50"
          style={{
            top: 0,
            left: 0,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
          color={cursors[id].color}
          name={cursors[id].user.name}
        />
      ))}
    </div>
  )
}
