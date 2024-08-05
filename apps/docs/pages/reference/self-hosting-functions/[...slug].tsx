import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

import selfHostingFunctionsCommonSections from '~/spec/common-self-hosting-functions-sections.json' assert { type: 'json' }

const sections = flattenSections(selfHostingFunctionsCommonSections)
const libraryPath = '/self-hosting-functions'

export default function SelfHostFunctionsReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingFunctions}
      sections={sections}
      pageProps={props}
      type="api"
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
