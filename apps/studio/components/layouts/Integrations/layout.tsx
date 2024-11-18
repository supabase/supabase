import { Header } from 'components/layouts/Integrations/header'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { useScroll } from 'framer-motion'
import { withAuth } from 'hooks/misc/withAuth'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

/**
 * Layout component for the Integrations section
 * Handles scroll-based sticky header behavior and authentication
 */
const IntegrationsLayout = ({ ...props }: PropsWithChildren) => {
  // Refs for the main scrollable area and header
  const mainElementRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  // Track if header should be in sticky state
  const [isSticky, setIsSticky] = useState(false)

  // State to hold the scrollable container element
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Initialize framer-motion scroll tracking
  // Only tracks scroll when container is available
  const scroll = useScroll({
    container: container ? { current: container } : undefined,
  })

  // Set up container reference once mainElementRef is mounted
  useEffect(() => {
    if (mainElementRef.current) {
      setContainer(mainElementRef.current)
    }
  }, [mainElementRef.current])

  // Set up scroll event listener to handle sticky header behavior
  useEffect(() => {
    // Exit if scroll tracking isn't available yet
    if (!scroll.scrollY) return

    // Update sticky state based on scroll position relative to header height
    const handleScroll = (latest: number) => {
      if (headerRef.current) {
        setIsSticky(latest > headerRef.current.offsetHeight)
      }
    }

    // Subscribe to scroll position changes
    const unsubscribe = scroll.scrollY.on('change', handleScroll)

    // Clean up scroll listener on unmount
    return () => {
      unsubscribe()
    }
  }, [scroll.scrollY])

  return (
    <ProjectLayout
      ref={mainElementRef}
      title={'Integrations'}
      product="Integrations"
      isBlocking={false}
    >
      <Header ref={headerRef} scroll={scroll} isSticky={isSticky} />
      {props.children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)
