import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import { gen_v3 } from '~/lib/refGenerator/helpers'
import apiCommonSections from '~/spec/common-api-sections.json' assert { type: 'json' }
import specFile from '~/spec/transforms/api_v0_openapi_deparsed.json' assert { type: 'json' }

// @ts-ignore
const generatedSpec = gen_v3(specFile, 'wat', { apiUrl: 'apiv0' })
const flatSections = flattenSections(apiCommonSections)
const libraryPath = '/api'

const ManagementApiReference = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.RefApi}
      menuData={props.menuData}
      sections={props.flatSections}
      spec={generatedSpec}
      pageProps={props}
      type="api"
    />
  )
}

const getStaticProps = (() => {
  const definedOperations = generatedSpec.operations.map((operation) => operation.operationId)

  return getGenericRefStaticProps({
    sections: apiCommonSections,
    flatSections,
    libraryPath,
    includeList: { tag: 'operation', list: definedOperations },
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default ManagementApiReference
export { getStaticProps, getStaticPaths }
