import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import spec from '~/spec/supabase_dart_v1.yml' assert { type: 'yml' }

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/dart/v0'

export default function JSReference(props) {
  return (
    <NavMenuProvider menuId={MenuId.RefDartV1}>
      <RefSectionHandler
        sections={sections}
        spec={spec}
        pageProps={props}
        type="client-lib"
        isOldVersion
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
