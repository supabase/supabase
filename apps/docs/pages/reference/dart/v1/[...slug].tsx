import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import spec from '~/spec/supabase_dart_v1.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/dart/v0'

export default function JSReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.RefDartV1}
      sections={sections}
      spec={spec}
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
