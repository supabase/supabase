import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import type { TypeSpec } from '~/components/reference/Reference.types'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import clientLibsCommonSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json' assert { type: 'json' }
import spec from '~/spec/supabase_js_v2.yml' assert { type: 'yml' }

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/javascript'

export default function JSReference(props) {
  return (
    <NavMenuProvider menuId={MenuId.RefJavaScriptV2}>
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
