import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { type MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefEducationSection from '~/components/reference/RefEducationSection'
import RefFunctionSection from '~/components/reference/RefFunctionSection'

import RefSubLayout from '~/layouts/ref/RefSubLayout'
import ApiOperationSection from './ApiOperationSection'
import CliCommandSection from './CLICommandSection'
import OldVersionAlert from './OldVersionAlert'
import { IAPISpec, ICommonSection, IRefStaticDoc, ISpec, TypeSpec } from './Reference.types'
import { MainSkeleton } from '~/layouts/MainSkeleton'

interface RefSectionHandlerProps {
  sections: ICommonSection[]
  spec?: ISpec | IAPISpec
  typeSpec?: TypeSpec
  pageProps: { docs: IRefStaticDoc[] }
  type: 'client-lib' | 'cli' | 'api'
  isOldVersion?: boolean
  menuId: MenuId
}

const RefSectionHandler = (props: RefSectionHandlerProps) => {
  const router = useRouter()

  const [slug] = router.query.slug

  // When user lands on a url like http://supabase.com/docs/reference/javascript/sign-up
  // find the #sign-up element and scroll to that
  useEffect(() => {
    document.getElementById(slug)?.scrollIntoView()
  }, [slug])

  useEffect(() => {
    function handler() {
      const [slug] = window.location.pathname.split('/').slice(-1)
      document.getElementById(slug)?.scrollIntoView()
    }

    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [])

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
      <MainSkeleton menuId={props.menuId}>
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
      </MainSkeleton>
    </>
  )
}

export default RefSectionHandler
