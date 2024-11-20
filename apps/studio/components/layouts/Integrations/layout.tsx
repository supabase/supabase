import { useParams } from 'common'
import { wrapperMetaComparator } from 'components/interfaces/Database/Wrappers/Wrappers.utils'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { Header } from 'components/layouts/Integrations/header'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { ProductMenu } from 'components/ui/ProductMenu'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { useScroll } from 'framer-motion'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'

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
  const { id } = useParams()
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

  const { data: fdwData } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = fdwData?.result || []

  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      ref={mainElementRef}
      title={'Integrations'}
      product="Integrations"
      isBlocking={false}
      productMenu={
        <ProductMenu page={page} menu={generateIntegrationsMenu(wrappers, id, project?.ref)} />
      }
    >
      <Header ref={headerRef} scroll={scroll} isSticky={isSticky} />
      {props.children}
    </ProjectLayout>
  )
}

const IntegrationsLayoutSide = ({ ...props }: PropsWithChildren) => {
  const { id } = useParams()
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const { data: fdwData } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappers = fdwData?.result || []

  // generateIntegrationsMenu()

  return (
    <ProjectLayout
      isLoading={false}
      product="Integrations"
      // productMenu={
      //   <ProductMenu page={page} menu={generateIntegrationsMenu(wrappers, id, project?.ref)} />
      // }
    >
      {props.children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)

const generateIntegrationsMenu = (wrappers: FDW[], integrationId?: string, projectRef?: string) => {
  const installedIntegrations = INTEGRATIONS.filter((integration) => {
    if (integration.type === 'wrapper') {
      return wrappers.find((wrapper) => wrapperMetaComparator(integration.meta, wrapper))
    }
    return false
  })

  return [
    {
      title: 'Installed Integrations',
      // hideTitle: true,
      items: [
        {
          name: 'All Integratons',
          key: 'all-integrations',
          url: `/project/${projectRef}/integrations/landing`,
          // icon: <Grid2x2Plus size={14} />,
        },
      ],
    },
    {
      title: 'Installed Integrations',
      items: installedIntegrations.map((integration) => ({
        name: integration.name,
        key: integration.id,
        url: `/project/${projectRef}/integrations/${integration.id}`,
        icon: (
          <div className="relative w-6 h-6 bg-surface-400 border rounded">
            <Image
              key={`icon-${integration.id}`}
              fill
              src={integration.icon}
              alt={integration.name}
              className="p-0.5"
            />
          </div>
        ),
      })),
    },
    // integrationId
    //   ? {
    //       title: 'Pages',
    //       items: [
    //         {
    //           name: 'Overview',
    //           key: 'settings',
    //           url: `/project/${projectRef}/integrations/${integrationId}?tab=overview`,
    //         },
    //         {
    //           name: 'Wrappers',
    //           key: 'settings',
    //           url: `/project/${projectRef}/integrations/${integrationId}?tab=wrappers`,
    //         },
    //         {
    //           name: 'Logs',
    //           key: 'settings',
    //           url: `/project/${projectRef}/integrations/${integrationId}?tab=logs`,
    //         },
    //       ],
    //     }
    //   : undefined,
  ].filter(Boolean)
}
