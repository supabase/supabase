import clientLibsCommonSections from '~/spec/common-client-libs-sections.json'
import spec from '~/spec/supabase_kt_v1.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import { handleRefStaticProps } from '~/lib/mdx/handleRefStaticProps'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/kotlin/v1'

export default function KotlinReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.RefKotlinV1}
      menuData={props.menuData}
      sections={sections}
      spec={spec}
      pageProps={props}
      type="client-lib"
      isOldVersion
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps({
    sections,
    spec,
    libraryPath,
    excludedName: 'reference_kotlin_v1',
  })
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
