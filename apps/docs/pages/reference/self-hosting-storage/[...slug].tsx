import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import { gen_v3 } from '~/lib/refGenerator/helpers'
import selfHostingStorageCommonSections from '~/spec/common-self-hosting-storage-sections.json' assert { type: 'json' }
import storageSpec from '~/spec/transforms/storage_v0_openapi_deparsed.json' assert { type: 'json' }

// @ts-ignore
const spec = gen_v3(storageSpec, 'wat', { apiUrl: 'apiv0' })
const flatSections = flattenSections(selfHostingStorageCommonSections)
const libraryPath = '/self-hosting-storage'

const SelfHostStorageReference = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingStorage}
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
    sections: selfHostingStorageCommonSections,
    flatSections,
    libraryPath,
    includeList: { tag: 'operation', list: definedOperations },
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default SelfHostStorageReference
export { getStaticProps, getStaticPaths }
