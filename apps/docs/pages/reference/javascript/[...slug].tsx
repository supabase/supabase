import { compact } from 'lodash'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { toClientLibraryMenu } from '~/components/Navigation/NavigationMenu/utils.server'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
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
    <RefSectionHandler
      menuId={MenuId.RefJavaScriptV2}
      menuData={props.menuData}
      sections={sections}
      spec={spec}
      typeSpec={typeSpec}
      pageProps={props}
      type="client-lib"
    />
  )
}

export async function getStaticProps() {
  const includedFns = compact(
    spec?.functions?.map(<T extends object>(fn: T) => ('id' in fn ? fn.id : null)) ?? []
  ) as Array<string>
  const menuData = toClientLibraryMenu({
    excludedName: 'reference_javascript_v2',
    sectionPath: '/javascript',
    includedFunctions: includedFns,
  })
  return { props: { ...(await handleRefStaticProps(sections, libraryPath)).props, menuData } }
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
