import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

import selfHostingAnalyticsCommonSections from '~/spec/common-self-hosting-analytics-sections.json' assert { type: 'json' }
import analyticsSpec from '~/spec/transforms/analytics_v0_openapi_deparsed.json' assert { type: 'json' }

const sections = flattenSections(selfHostingAnalyticsCommonSections)
const libraryPath = '/self-hosting-analytics'

// @ts-ignore
const spec = gen_v3(analyticsSpec, 'wat', { apiUrl: 'apiv0' })

export default function SelfHostAnalyticsReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingAnalytics}
      sections={sections}
      spec={spec}
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
