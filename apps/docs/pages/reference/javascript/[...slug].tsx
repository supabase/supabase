import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import typeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-expect-error
import spec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(clientLibsCommonSections)

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} typeSpec={typeSpec} pageProps={props} />
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  return handleRefStaticProps(sections, params, '/js', '/javascript')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}

export const config = {
  // pnpm in my case, maybe 'node_modules/**/shiki/**/*.json' for npm or yarn.
  unstable_includeFiles: [
    'node_modules/.pnpm/**/shiki/**/*.json',
    'node_modules/**/shiki/**/*.json',
    'node_modules/.npm/shiki/**/*.json',
  ],
}
