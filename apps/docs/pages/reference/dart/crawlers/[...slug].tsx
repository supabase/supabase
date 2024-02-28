import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import RefSEO from '~/components/reference/RefSEO'
import {
  getClientRefStaticPaths,
  getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_dart_v2.yml' assert { type: 'yml' }

const libraryPath = '/dart'

const DartReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
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
        menuId={MenuId.RefDartV2}
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
    excludedName: 'reference_dart_v2',
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default DartReferencePage
export { getStaticProps, getStaticPaths }
