import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import { gen_v3 } from '~/lib/refGenerator/helpers'

import authSpec from '~/spec/auth_v1_openapi.json' assert { type: 'json' }
import selfHostingAuthCommonSections from '~/spec/common-self-hosting-auth-sections.json'

const sections = flattenSections(selfHostingAuthCommonSections)
const libraryPath = '/self-hosting-auth'

// @ts-ignore
const spec = gen_v3(authSpec, 'wat', { apiUrl: 'apiv0' })

export default function SelfHostAuthReference(props) {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingAuth}
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
