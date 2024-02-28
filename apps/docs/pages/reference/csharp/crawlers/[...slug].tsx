import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import RefSEO from '~/components/reference/RefSEO'
import {
  getClientRefStaticPaths,
  getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_csharp_v0.yml' assert { type: 'yml' }

const libraryPath = '/csharp'

const CSharpReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  const router = useRouter()
  const slug = router.query.slug[0]
  const filteredSection = props.flatSections.filter((section) => section.id === slug)

  const pageTitle = filteredSection[0]?.title
    ? `${filteredSection[0]?.title} | Supabase`
    : 'Supabase'

  return (
    <>
      <RefSEO title={pageTitle} />

      <RefSectionHandler
        menuId={MenuId.RefCSharpV0}
        menuData={props.menuData}
        sections={filteredSection}
        spec={spec}
        typeSpec={props.typeSpec}
        pageProps={props}
        type="client-lib"
      />
    </>
  )
}

const getStaticProps = (async () => {
  return getClientRefStaticProps({
    spec,
    libraryPath,
    excludedName: 'reference_csharp_v0',
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default CSharpReferencePage
export { getStaticProps, getStaticPaths }
