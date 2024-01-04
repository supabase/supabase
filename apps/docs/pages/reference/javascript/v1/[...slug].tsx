import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import typeSpec from '~/spec/enrichments/tsdoc_v1/combined.json'
import spec from '~/spec/supabase_js_v1.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/javascript/v1'

export default function JSReference(props) {
  return (
    <RefSectionHandler
      sections={sections}
      spec={spec}
      typeSpec={typeSpec}
      pageProps={props}
      type="client-lib"
      isOldVersion
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
