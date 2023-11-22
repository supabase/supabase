import { useEffect, useRef } from 'react'

const BottomMarker = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth' })
      }, 700)
    }
  }, [ref])

  return <div ref={ref} />
}

export default BottomMarker
