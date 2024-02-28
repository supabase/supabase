import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import selfHostingRealtimeCommonSections from '~/spec/common-self-hosting-realtime-sections.json' assert { type: 'json' }

// @ts-ignore
const flatSections = flattenSections(selfHostingRealtimeCommonSections)
const libraryPath = '/self-hosting-realtime'

const SelfHostRealtimeReference = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.SelfHostingRealtime}
      menuData={props.menuData}
      sections={props.flatSections}
      docs={props.docs}
      type="api"
    />
  )
}

const getStaticProps = (() => {
  return getGenericRefStaticProps({
    sections: selfHostingRealtimeCommonSections,
    flatSections,
    libraryPath,
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default SelfHostRealtimeReference
export { getStaticProps, getStaticPaths }
