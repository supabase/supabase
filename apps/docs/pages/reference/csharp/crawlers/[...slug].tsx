import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import spec from '~/spec/supabase_csharp_v1.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { useRouter } from 'next/compat/router'
import RefSEO from '~/components/reference/RefSEO'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import type { TypeSpec } from '~/components/reference/Reference.types'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/csharp'

export default function CSharpReference(props) {
  const router = useRouter()
  const slug = router.query.slug[0]
  const filteredSection = sections.filter((section) => section.id === slug)

  const pageTitle = filteredSection[0]?.title
    ? `${filteredSection[0]?.title} | Supabase`
    : 'Supabase'

  return (
    <>
      <RefSEO title={pageTitle} />

      <RefSectionHandler
        menuId={MenuId.RefCSharpV1}
        sections={filteredSection}
        spec={spec}
        pageProps={props}
        type="client-lib"
      />
    </>
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
