import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import RefSEO from '~/components/reference/RefSEO'
import {
  getClientRefStaticPaths,
  getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_kt_v1.yml' assert { type: 'yml' }

const libraryPath = '/kotlin'

const KotlinReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
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
        menuId={MenuId.RefKotlinV1}
        menuData={props.menuData}
        sections={filteredSection}
        docs={props.docs}
        spec={spec}
        type="client-lib"
      />
    </>
  )
}

const getStaticProps = (async () => {
  return getClientRefStaticProps({
    spec,
    libraryPath,
    excludedName: 'reference_kotlin_v1',
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default KotlinReferencePage
export { getStaticProps, getStaticPaths }
