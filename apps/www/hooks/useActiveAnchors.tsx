import { useEffect, useRef, useState } from 'react'

const useActiveAnchors = (
  anchorsQuerySelector: string = 'h2',
  tocQuerySelector: string = '.prose-toc a',
  offset: number = 200
) => {
  const anchors = useRef<NodeListOf<HTMLHeadingElement> | null>(null)
  const toc = useRef<NodeListOf<HTMLHeadingElement> | null>(null)

  const handleScroll = () => {
    const pageYOffset = window.pageYOffset
    let newActiveAnchor: string = ''

    anchors.current?.forEach((anchor) => {
      if (pageYOffset >= anchor.offsetTop - offset) {
        newActiveAnchor = anchor.id
      }
    })

    toc.current?.forEach((link) => {
      link.classList.remove('translate-x-1')
      link.classList.remove('!text-brand-900')
      if (link.getAttribute('href')?.replace('#', '') === newActiveAnchor) {
        link.classList.add('translate-x-1')
        link.classList.add('!text-brand-900')
      }
    })
  }

  useEffect(() => {
    anchors.current = document.querySelectorAll(anchorsQuerySelector)
    toc.current = document.querySelectorAll(tocQuerySelector)

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return null
}

export default useActiveAnchors
