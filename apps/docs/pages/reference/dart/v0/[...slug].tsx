import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
// @ts-expect-error
import spec from '~/../../spec/supabase_dart_v0.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(clientLibsCommonSections)

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="client-lib" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, '/dart/v0')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
