import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { TypeSpec } from '~/components/reference/Reference.types'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json'
import spec from '~/spec/supabase_py_v2.yml' assert { type: 'yml' }

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/python'

export default function PyReference(props) {
  return (
    <NavMenuProvider menuId={MenuId.RefPythonV2}>
      <RefSectionHandler
        sections={sections}
        spec={spec}
        typeSpec={typeSpec as TypeSpec}
        pageProps={props}
        type="client-lib"
      />
    </NavMenuProvider>
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
