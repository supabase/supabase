'use client'

import { useEffect, useState } from 'react'

export type Viewport = { width: number; height: number }

function getViewport(): Viewport {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(getViewport)

  useEffect(() => {
    const onResize = () => setViewport(getViewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return viewport
}
