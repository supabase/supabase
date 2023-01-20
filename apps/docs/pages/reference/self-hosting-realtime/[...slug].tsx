import selfHostingRealtimeCommonSections from '~/../../spec/common-self-hosting-realtime-sections.json'

import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

const sections = flattenSections(selfHostingRealtimeCommonSections)

export default function JSReference(props) {
  return <RefSectionHandler sections={sections} pageProps={props} type="api" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, '/self-hosting-realtime')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
