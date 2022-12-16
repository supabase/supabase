import { useEffect, useState } from 'react'

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: null, y: null })
  useEffect(() => {
    const updateMousePosition = (ev) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY })
    }
    window.addEventListener('mousemove', updateMousePosition)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [])
  return mousePosition
}
export default useMousePosition
