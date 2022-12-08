import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import typeSpec from '~/../../spec/enrichments/tsdoc_v1/combined.json'
// @ts-expect-error
import spec from '~/../../spec/supabase_js_v1_temp_new_shape.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(clientLibsCommonSections)

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} typeSpec={typeSpec} pageProps={props} />
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  return handleRefStaticProps(sections, params, '/js/v1', '/javascript/v1')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
