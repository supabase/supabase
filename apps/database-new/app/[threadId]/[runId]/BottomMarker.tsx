'use client'

import { createRef, useEffect } from 'react'

const BottomMarker = () => {
  const ref = createRef<HTMLDivElement>()

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth' })
      }, 700)
    }
  }, [ref])

  return <div ref={ref} />
}

export { BottomMarker }
