import { useEffect, useRef } from 'react'

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
      link.classList.remove('toc-animate')
      // TODO: escape emojis
      // The problem is that MDXRemote strips out emojis on slugs
      // but ReactMarkdown doesn't,instead it encodes them
      const sanitizedHref = (link.getAttribute('href') ?? '').replace('#', '')
      const isMatch = sanitizedHref === newActiveAnchor

      if (isMatch) {
        link.classList.add('toc-animate')
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
