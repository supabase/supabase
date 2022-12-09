import apiCommonSections from '~/../../spec/common-api-sections.json' assert { type: 'json' }
import specFile from '~/../../spec/transforms/api_v0_openapi_deparsed.json' assert { type: 'json' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

// @ts-ignore
const generatedSpec = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })

const sections = flattenSections(apiCommonSections)

console.log('sections', sections)

export default function Config(props) {
  return <RefSectionHandler sections={sections} spec={generatedSpec} pageProps={props} type="api" />
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  return handleRefStaticProps(sections, params, '/api', '/api')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
