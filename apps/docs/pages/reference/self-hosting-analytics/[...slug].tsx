import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import { gen_v3 } from '~/lib/refGenerator/helpers'
import selfHostingAnalyticsCommonSections from '~/spec/common-self-hosting-analytics-sections.json' assert { type: 'json' }
import analyticsSpec from '~/spec/transforms/analytics_v0_openapi_deparsed.json' assert { type: 'json' }

// @ts-ignore
const spec = gen_v3(analyticsSpec, 'wat', { apiUrl: 'apiv0' })
const flatSections = flattenSections(selfHostingAnalyticsCommonSections)
const libraryPath = '/self-hosting-analytics'

const SelfHostAnalyticsReference = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingAnalytics}
      menuData={props.menuData}
      sections={props.flatSections}
      spec={spec}
      pageProps={props}
      type="api"
    />
  )
}

const getStaticProps = (() => {
  const definedOperations = spec.operations.map((operation) => operation.operationId)

  return getGenericRefStaticProps({
    sections: selfHostingAnalyticsCommonSections,
    flatSections,
    libraryPath,
    includeList: { tag: 'operation', list: definedOperations },
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default SelfHostAnalyticsReference
export { getStaticProps, getStaticPaths }
