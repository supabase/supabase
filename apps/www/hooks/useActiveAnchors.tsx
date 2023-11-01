import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { isBrowser, stripEmojis } from '~/lib/helpers'

const useActiveAnchors = (
  anchorsQuerySelector: string = 'h2',
  tocQuerySelector: string = '.prose-toc a',
  offset: number = 200
) => {
  const router = useRouter()
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

      // Need to decodeURI the href to get emojis, then strip them off and remove "--""
      // to make toc hrefs and content headings ids match
      const sanitizedHref = stripEmojis(
        decodeURI(link.getAttribute('href') ?? '').replace('#', '')
      ).replaceAll('-', '')
      const isMatch = sanitizedHref === newActiveAnchor.replaceAll('-', '')

      if (isMatch) {
        link.classList.add('toc-animate')
      }
    })
  }

  useEffect(() => {
    if (!isBrowser || !router.isReady) return
    anchors.current = document.querySelectorAll(anchorsQuerySelector)
    toc.current = document.querySelectorAll(tocQuerySelector)

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [router])

  return null
}

export default useActiveAnchors
