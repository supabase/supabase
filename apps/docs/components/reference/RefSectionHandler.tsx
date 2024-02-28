import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react'

import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefEducationSection from '~/components/reference/RefEducationSection'
import RefFunctionSection from '~/components/reference/RefFunctionSection'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import ApiOperationSection from './ApiOperationSection'
import CliCommandSection from './CLICommandSection'
import OldVersionAlert from './OldVersionAlert'
import { IAPISpec, ICommonSection, IRefStaticDoc, ISpec, TypeSpec } from './Reference.types'
import { RefMainSkeleton } from '~/layouts/MainSkeleton'
import { type RefMenuCategory } from '../Navigation/NavigationMenu/NavigationMenuRefListItems'
import { useFirePageChange } from '../Navigation/NavigationMenu/utils'
import { scrollParentOrigin } from '~/lib/uiUtils'

/**
 * When a user lands on a URL like https://supabase.com/docs/reference/javascript/sign-up,
 * find the #sign-up element and scroll to it.
 */
const useScrollTo = () => {
  const router = useRouter()
  const [slug] = router.query.slug

  useEffect(() => {
    const elem = document.getElementById(slug)
    const isFirstItem = elem?.dataset.navIndex === '0'
    if (isFirstItem) {
      scrollParentOrigin(elem)
    } else {
      elem?.scrollIntoView()
    }
  }, [slug])

  useEffect(() => {
    const handler = () => {
      const [slug] = window.location.pathname.split('/').slice(-1)
      const elem = document.getElementById(slug)
      const isFirstItem = elem?.dataset.navIndex === '0'
      if (isFirstItem) {
        scrollParentOrigin(elem)
      } else {
        elem?.scrollIntoView()
      }
    }

    window.addEventListener('popstate', handler)
    return window.removeEventListener('popstate', handler)
  }, [])
}

const useIntersectionObserver = (
  cb: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const [observer, setObserver] = useState<IntersectionObserver>()

  useEffect(() => {
    const observer = new IntersectionObserver(cb, options)
    setObserver(observer)

    return observer.disconnect.bind(observer)
  }, [cb, options])

  return observer
}

const IntersectionContext = createContext<IntersectionObserver | undefined>(undefined)

const useObserveIntersection = () => {
  /*
   * Not throwing an error if context is null because IntersectionContext isn't
   * set until useEffect kicks in
   */
  const context = useContext(IntersectionContext)

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const elem = ref.current
    if (context) context.observe(elem)

    return () => {
      if (context) context.unobserve(elem)
    }
  }, [context])

  return { ref }
}

const IntersectionContextProvider = ({
  cb,
  options,
  children,
}: PropsWithChildren<{ cb: IntersectionObserverCallback; options?: IntersectionObserverInit }>) => {
  const _observer = useIntersectionObserver(cb, options)

  return <IntersectionContext.Provider value={_observer}>{children}</IntersectionContext.Provider>
}

const RefSectionIntersectProvider = ({ children }: PropsWithChildren) => {
  const firePageChange = useFirePageChange()

  const cb = useCallback(
    (entries: Array<IntersectionObserverEntry>) => {
      const firstIntersecting = entries.find((entry) => entry.isIntersecting)
      if (firstIntersecting) {
        window.history.replaceState(null, '', firstIntersecting.target.id)
        firePageChange(firstIntersecting.target)
      }
    },
    [firePageChange]
  )

  const options = useMemo(
    () => ({
      rootMargin: '0px 0px -50% 0px',
    }),
    []
  )

  return (
    <IntersectionContextProvider cb={cb} options={options}>
      {children}
    </IntersectionContextProvider>
  )
}

interface RefSectionHandlerProps {
  sections: ICommonSection[]
  spec?: ISpec | IAPISpec
  typeSpec?: TypeSpec
  pageProps: { docs: IRefStaticDoc[] }
  type: 'client-lib' | 'cli' | 'api'
  isOldVersion?: boolean
  menuId: MenuId
  menuData?: Array<RefMenuCategory>
}

const RefSectionHandler = (props: RefSectionHandlerProps) => {
  const router = useRouter()
  const [slug] = router.query.slug

  useScrollTo()

  function getPageTitle() {
    switch (props.type) {
      case 'client-lib':
        return props.spec.info.title
      case 'cli':
        return 'Supabase CLI reference'
      case 'api':
        return 'Supabase API reference'
      default:
        return 'Supabase Docs'
    }
  }

  const pageTitle = getPageTitle()
  const section = props.sections.find((section) => section.slug === slug)
  const fullTitle = `${pageTitle}${section ? ` - ${section.title}` : ''}`
  const path = router.asPath.replace('/crawlers', '')

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={section?.title ?? pageTitle} />
        <meta property="og:image" content={`https://supabase.com/docs/img/supabase-og-image.png`} />
        <meta
          name="twitter:image"
          content={`https://supabase.com/docs/img/supabase-og-image.png`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={`https://supabase.com${router.basePath}${path}`} />
      </Head>
      <RefMainSkeleton menuId={props.menuId} menuData={props.menuData}>
        <RefSectionIntersectProvider>
          {props.isOldVersion && <OldVersionAlert sections={props.sections} />}
          <RefSubLayout>
            {props.sections.map((section, i) => {
              const sectionType = section.type
              switch (sectionType) {
                case 'markdown':
                  const markdownData = props.pageProps.docs.find((doc) => doc.id === section.id)

                  return (
                    <RefEducationSection
                      key={section.id + i}
                      item={section}
                      markdownContent={markdownData}
                      {
                        /* Used to control scrolling of first item and prevent overscroll */ ...(i ===
                          0 && { 'data-nav-index': 0 })
                      }
                    />
                  )
                case 'function':
                  return (
                    <RefFunctionSection
                      key={section.id + i}
                      funcData={section}
                      commonFuncData={section}
                      spec={props.spec}
                      typeSpec={props.typeSpec}
                    />
                  )
                case 'cli-command':
                  return (
                    <CliCommandSection
                      key={section.id + i}
                      funcData={section}
                      commonFuncData={section}
                    />
                  )
                case 'operation':
                  return (
                    <ApiOperationSection
                      key={section.id + i}
                      funcData={section}
                      commonFuncData={section}
                      spec={props.spec}
                    />
                  )
                default:
                  throw new Error(`Unknown common section type '${sectionType}'`)
              }
            })}
          </RefSubLayout>
        </RefSectionIntersectProvider>
      </RefMainSkeleton>
    </>
  )
}

export { useObserveIntersection }
export default RefSectionHandler
