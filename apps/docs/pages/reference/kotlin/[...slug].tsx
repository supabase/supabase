import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import {
  getClientRefStaticPaths,
  getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_kt_v2.yml' assert { type: 'yml' }

const libraryPath = '/kotlin'

const KotlinReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.RefKotlinV2}
      menuData={props.menuData}
      sections={props.flatSections}
      spec={spec}
      pageProps={props}
      type="client-lib"
    />
  )
}

const getStaticProps = (async () => {
  return getClientRefStaticProps({
    spec,
    libraryPath,
    excludedName: 'reference_kotlin_v2',
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default KotlinReferencePage
export { getStaticProps, getStaticPaths }
