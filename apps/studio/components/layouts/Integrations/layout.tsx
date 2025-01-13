import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

import { IntegrationDefinition } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { Header } from 'components/layouts/Integrations/header'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { ProductMenu } from 'components/ui/ProductMenu'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useScroll } from 'framer-motion'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { IntegrationTabs } from './tabs'
import { Menu, Separator } from 'ui'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { GenericSkeletonLoader } from 'ui-patterns'
import AlertError from 'components/ui/AlertError'

/**
 * Layout component for the Integrations section
 * Handles scroll-based sticky header behavior and authentication
 */
const IntegrationsLayout = ({ ...props }: PropsWithChildren) => {
  const layoutSidebar = useFlag('integrationLayoutSidebar')
  if (layoutSidebar) {
    return <IntegrationsLayoutSide {...props} />
  }
  return <IntegrationTopHeaderLayout {...props} />
}

/**
 * Top level layout
 */
const IntegrationTopHeaderLayout = ({ ...props }: PropsWithChildren) => {
  const project = useSelectedProject()
  const router = useRouter()
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

  const segments = router.asPath.split('/')
  // construct the page url to be used to determine the active state for the sidebar
  const page = `${segments[3]}${segments[4] ? `/${segments[4]}` : ''}`

  const {
    installedIntegrations: integrations,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useInstalledIntegrations()
  const installedIntegrationItems = integrations.map((integration) => ({
    name: integration.name,
    label: integration.status,
    key: `integrations/${integration.id}`,
    url: `/project/${project?.ref}/integrations/${integration.id}/overview`,
    icon: (
      <div className="relative w-6 h-6 bg-white border rounded flex items-center justify-center">
        {integration.icon({ className: 'p-1' })}
      </div>
    ),
    items: [],
  }))

  return (
    <ProjectLayout
      ref={mainElementRef}
      title={'Integrations'}
      product="Integrations"
      isBlocking={false}
      productMenu={
        <>
          <ProductMenu page={page} menu={generateIntegrationsMenu({ projectRef: project?.ref })} />
          <Separator />
          <div className="p-6">
            <Menu.Group
              title={
                <div className="flex flex-col space-y-2 uppercase font-mono">
                  <span>Installed integrations</span>
                </div>
              }
            />
            {isLoading && <GenericSkeletonLoader />}
            {isError && (
              <AlertError
                showIcon={false}
                error={error}
                subject="Failed to retrieve installed integrations"
              />
            )}
            {isSuccess && (
              <div>
                {installedIntegrationItems.map((item) => (
                  <ProductMenuItem
                    key={item.key}
                    url={item.url}
                    name={item.name}
                    icon={item.icon}
                    isActive={page === item.key}
                    label={item.label}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      }
    >
      <Header scroll={scroll} ref={headerRef} />
      <IntegrationTabs scroll={scroll} isSticky={isSticky} />
      {props.children}
    </ProjectLayout>
  )
}

const IntegrationsLayoutSide = ({ ...props }: PropsWithChildren) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const project = useSelectedProject()

  const {
    installedIntegrations: integrations,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useInstalledIntegrations()
  const installedIntegrationItems = integrations.map((integration) => ({
    name: integration.name,
    label: integration.status,
    key: `integrations/${integration.id}`,
    url: `/project/${project?.ref}/integrations/${integration.id}/overview`,
    icon: (
      <div className="relative w-6 h-6 bg-white border rounded flex items-center justify-center">
        {integration.icon({ className: 'p-1' })}
      </div>
    ),
    items: [],
  }))

  return (
    <ProjectLayout
      isLoading={false}
      product="Integrations"
      productMenu={
        <>
          <ProductMenu page={page} menu={generateIntegrationsMenu({ projectRef: project?.ref })} />
          <Separator />
          <div className="p-6">
            <Menu.Group
              title={
                <div className="flex flex-col space-y-2 uppercase font-mono">
                  <span>Installed integrations</span>
                </div>
              }
            />
            {isLoading && <GenericSkeletonLoader />}
            {isError && (
              <AlertError
                showIcon={false}
                error={error}
                subject="Failed to retrieve installed integrations"
              />
            )}
            {isSuccess && (
              <div>
                {installedIntegrationItems.map((item) => (
                  <ProductMenuItem
                    key={item.key}
                    url={item.url}
                    name={item.name}
                    icon={item.icon}
                    isActive={page === item.key}
                    label={item.label}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      }
    >
      {props.children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)

const generateIntegrationsMenu = ({ projectRef }: { projectRef?: string }): ProductMenuGroup[] => {
  return [
    {
      title: 'All Integrations',
      items: [
        {
          name: 'All Integrations',
          key: 'integrations',
          url: `/project/${projectRef}/integrations`,
          items: [],
        },
      ],
    },
  ].filter(Boolean)
}
