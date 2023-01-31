import storageSpec from '~/../../spec/storage_v0_openapi.json' assert { type: 'json' }
import selfHostingStorageCommonSections from '~/../../spec/common-self-hosting-storage-sections.json'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

const sections = flattenSections(selfHostingStorageCommonSections)

// @ts-ignore
const spec = gen_v3(storageSpec, 'wat', { apiUrl: 'apiv0' })

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="api" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, '/self-hosting-storage')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
