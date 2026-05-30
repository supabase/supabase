import type { PropsWithChildren } from 'react'

import { useCommandMenuTouchGestures } from './hooks/viewHooks'

export function CommandHeader({ children }: PropsWithChildren) {
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useCommandMenuTouchGestures()

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  )
}
