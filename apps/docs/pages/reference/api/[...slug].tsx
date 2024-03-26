import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

import apiCommonSections from '~/spec/common-api-sections.json' assert { type: 'json' }
import specFile from '~/spec/transforms/api_v0_openapi_deparsed.json' assert { type: 'json' }

// @ts-ignore
const generatedSpec = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })
const sections = flattenSections(apiCommonSections)
const libraryPath = '/api'

export default function Config(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.RefApi}
      sections={sections}
      spec={generatedSpec}
      pageProps={props}
      type="api"
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
