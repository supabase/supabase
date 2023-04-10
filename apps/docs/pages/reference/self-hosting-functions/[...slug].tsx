import functionsSpec from '~/../../spec/transforms/functions_v0_openapi_deparsed.json' assert { type: 'json' }
import selfHostingFunctionsCommonSections from '~/../../spec/common-self-hosting-functions-sections.json'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

const sections = flattenSections(selfHostingFunctionsCommonSections)

// @ts-ignore
const spec = gen_v3(functionsSpec, 'wat', { apiUrl: 'apiv0' })

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="api" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, '/self-hosting-functions')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
