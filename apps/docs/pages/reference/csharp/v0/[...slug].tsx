import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import spec from '~/../../spec/supabase_csharp_v0.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(clientLibsCommonSections)
const libraryPath = '/csharp/v0'

export default function CSharpReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="client-lib" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
