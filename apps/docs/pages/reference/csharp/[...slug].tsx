import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import RefSectionHandler from '~/components/reference/RefSectionHandler'
import type { ICommonSection } from '~/components/reference/Reference.types'
import flatSections from '~/features/Navigation/refNavigation/generated/commonClientLibFlat.json' assert { type: 'json' }
import menuData from '~/features/Navigation/refNavigation/generated/reference_csharp_v0.json' assert { type: 'json' }
import { MenuId } from '~/features/Navigation/NavigationMenu/menus'
import { RefMainSkeleton } from '~/layouts/MainSkeleton'
import spec from '~/spec/supabase_csharp_v0.yml' assert { type: 'yml' }
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'

const libraryPath = '/csharp'

const CSharpReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefMainSkeleton menuId={MenuId.RefCSharpV0} menuData={menuData}>
      <RefSectionHandler
        sections={flatSections as Array<ICommonSection>}
        docs={props.docs}
        spec={spec}
        type="client-lib"
      />
    </RefMainSkeleton>
  )
}

const getStaticProps = (async () => {
  return getGenericRefStaticProps({
    flatSections: flatSections as Array<ICommonSection>,
    libraryPath,
  })
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
  return getGenericRefStaticPaths({ flatSections: flatSections as Array<ICommonSection> })
}) satisfies GetStaticPaths

export default CSharpReferencePage
export { getStaticProps, getStaticPaths }
