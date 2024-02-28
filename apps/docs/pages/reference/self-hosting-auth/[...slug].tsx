import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import { gen_v3 } from '~/lib/refGenerator/helpers'
import selfHostingAuthCommonSections from '~/spec/common-self-hosting-auth-sections.json' assert { type: 'json' }
import authSpec from '~/spec/transforms/auth_v1_openapi_deparsed.json' assert { type: 'json' }

// @ts-ignore
const spec = gen_v3(authSpec, 'wat', { apiUrl: 'apiv0' })
const flatSections = flattenSections(selfHostingAuthCommonSections)
const libraryPath = '/self-hosting-auth'

const SelfHostAuthReference = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingAuth}
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
    sections: selfHostingAuthCommonSections,
    flatSections,
    libraryPath,
    includeList: { tag: 'operation', list: definedOperations },
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default SelfHostAuthReference
export { getStaticProps, getStaticPaths }
