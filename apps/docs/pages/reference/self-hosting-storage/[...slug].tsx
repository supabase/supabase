import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

import storageSpec from '~/spec/storage_v0_openapi.json' assert { type: 'json' }
import selfHostingStorageCommonSections from '~/spec/common-self-hosting-storage-sections.json' assert { type: 'json' }

const sections = flattenSections(selfHostingStorageCommonSections)
const libraryPath = '/self-hosting-storage'

// @ts-ignore
const spec = gen_v3(storageSpec, 'wat', { apiUrl: 'apiv0' })

export default function SelfHostStorageReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingStorage}
      sections={sections}
      spec={spec}
      pageProps={props}
      type="api"
    />
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
