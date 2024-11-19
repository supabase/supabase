import { Header } from 'components/layouts/Integrations/header'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useScroll } from 'framer-motion'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { generateAdvisorsMenu } from '../AdvisorsLayout/AdvisorsMenu.utils'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRouter } from 'next/router'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { wrapperMetaComparator } from 'components/interfaces/Database/Wrappers/Wrappers.utils'
import { Table2 } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'common'

/**
 * Layout component for the Integrations section
 * Handles scroll-based sticky header behavior and authentication
 */
const IntegrationsLayout = ({ ...props }: PropsWithChildren) => {
  const layoutSidebar = useFlag('integrationLayoutSidebar')
  if (layoutSidebar) {
    return <IntegrationsLayoutSide {...props} />
  }
  return <IntegrationsLayoutTop {...props} />
}

/**
 * Top level layout
 */
const IntegrationsLayoutTop = ({ ...props }: PropsWithChildren) => {
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

  const generateIntegrationsMenu = () => {
    const installedIntegrations = INTEGRATIONS.filter((integration) => {
      if (integration.type === 'wrapper') {
        return wrappers.find((wrapper) => wrapperMetaComparator(integration.meta, wrapper))
      }
      return false
    })

    return [
      {
        title: 'Installed Integrations',
        items: [
          {
            name: 'All Integrations',
            key: 'all-integrations',
            url: `/project/${project?.ref}/integrations/landing`,
            icon: <Table2 size={14} />,
          },
        ],
      },
      {
        title: 'Installed Integrations',
        items: installedIntegrations.map((integration) => ({
          name: integration.name,
          key: integration.id,
          url: `/project/${project?.ref}/integrations/${integration.id}`,
          icon: (
            <div className="relative w-6 h-6 bg-surface-400 border rounded">
              <Image fill src={integration.icon} alt={integration.name} className="p-0.5" />
            </div>
          ),
        })),
      },
      id
        ? {
            title: 'Pages',
            items: [
              {
                name: 'Overview',
                key: 'settings',
                url: `/project/${project?.ref}/integrations/${id}?tab=overview`,
              },
              {
                name: 'Wrappers',
                key: 'settings',
                url: `/project/${project?.ref}/integrations/${id}?tab=wrappers`,
              },
              {
                name: 'Logs',
                key: 'settings',
                url: `/project/${project?.ref}/integrations/${id}?tab=logs`,
              },
            ],
          }
        : undefined,
    ].filter(Boolean)
  }

  // generateIntegrationsMenu()

  return (
    <ProjectLayout
      isLoading={false}
      product="Integrations"
      productMenu={<ProductMenu page={page} menu={generateIntegrationsMenu()} />}
    >
      {props.children}
    </ProjectLayout>
  )
}

// Wrap component with authentication HOC before exporting
export default withAuth(IntegrationsLayout)
