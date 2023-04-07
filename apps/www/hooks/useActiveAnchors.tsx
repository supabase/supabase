import { useEffect, useRef, useState } from 'react'

const useActiveAnchors = (querySelector: string = 'h2') => {
  const anchors = useRef<NodeListOf<HTMLHeadingElement> | null>(null)
  const [activeSection, setActiveSection] = useState<any>('')

  const handleScroll = () => {
    const pageYOffset = window.pageYOffset
    let newActiveAnchor = null
    const offset = 150

    anchors.current?.forEach((anchor) => {
      if (pageYOffset >= anchor.offsetTop - offset) {
        newActiveAnchor = anchor.id
      }
    })

    setActiveSection(newActiveAnchor)
  }

  useEffect(() => {
    anchors.current = document.querySelectorAll(querySelector)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return activeSection
}

export default useActiveAnchors
