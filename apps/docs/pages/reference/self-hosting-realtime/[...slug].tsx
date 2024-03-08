import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { NavMenuProvider } from '~/components/Navigation/NavigationMenu/NavigationMenuContext'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'
import selfHostingRealtimeCommonSections from '~/spec/common-self-hosting-realtime-sections.json' assert { type: 'json' }

const sections = flattenSections(selfHostingRealtimeCommonSections)
const libraryPath = '/self-hosting-realtime'

export default function SelfHostRealtimeReference(props) {
  return (
    <NavMenuProvider menuId={MenuId.SelfHostingRealtime}>
      <RefSectionHandler sections={sections} pageProps={props} type="api" />
    </NavMenuProvider>
  )
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
