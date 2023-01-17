import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import typeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-expect-error
import spec from '~/../../spec/supabase_csharp_v0.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { useRouter } from 'next/router'
import RefSEO from '~/components/reference/RefSEO'

const sections = flattenSections(clientLibsCommonSections)

export default function JSReference(props) {
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
        sections={filteredSection}
        spec={spec}
        typeSpec={typeSpec}
        pageProps={props}
        type="client-lib"
      />
    </>
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, '/csharp/v0')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
