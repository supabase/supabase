import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json'
import spec from '~/spec/supabase_py_v2.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/python'

export default function PyReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.RefPythonV2}
      sections={sections}
      spec={spec}
      typeSpec={typeSpec}
      pageProps={props}
      type="client-lib"
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
