import { useRouter } from 'next/router'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import RefSEO from '~/components/reference/RefSEO'
import type { TypeSpec } from '~/components/reference/Reference.types'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json'
import spec from '~/spec/supabase_dart_v1.yml' assert { type: 'yml' }

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/dart/v0'

export default function DartReference(props) {
  const router = useRouter()
  const slug = router.query.slug[0]
  const filteredSection = sections.filter((section) => section.slug === slug)

  const pageTitle = filteredSection[0]?.title
    ? `${filteredSection[0]?.title} | Supabase`
    : 'Supabase'
  return (
    <>
      <RefSEO title={pageTitle} />
      <NavMenuProvider menuId={MenuId.RefDartV1}>
        <RefSectionHandler
          sections={filteredSection}
          spec={spec}
          typeSpec={typeSpec as TypeSpec}
          pageProps={props}
          type="client-lib"
        />
      </NavMenuProvider>
    </>
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
