import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import {
  getClientRefStaticPaths,
  getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_js_v1.yml' assert { type: 'yml' }

const libraryPath = '/javascript/v1'

const JavaScriptReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.RefJavaScriptV1}
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
    excludedName: 'reference_javascript_v1',
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default JavaScriptReferencePage
export { getStaticProps, getStaticPaths }
