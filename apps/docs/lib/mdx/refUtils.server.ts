import { compact } from 'lodash'

import {
  type CommonRefSections,
  type IncludeList,
  toRefNavMenu,
} from '~/components/Navigation/NavigationMenu/utils.server'
import { type ICommonMarkdown, type ICommonSection } from '~/components/reference/Reference.types'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'
import { assertServer } from '~/lib/server'

assertServer()

const getGenericRefStaticProps = async ({
  sections,
  flatSections,
  spec,
  libraryPath,
  excludedName,
  includeList: _includeList,
}: {
  sections: CommonRefSections
  flatSections: Array<ICommonSection>
  spec?: any
  libraryPath: `/${string}`
  excludedName?: string
  includeList?: IncludeList
}) => {
  // Generate nav menu
  const includeList = _includeList ?? {
    tag: 'function',
    list: compact(
      (spec?.functions ?? []).map(<T extends object>(fn: T) => ('id' in fn ? fn.id : null))
    ),
  }
  const menuData = toRefNavMenu({
    sections,
    excludedName,
    sectionPath: libraryPath,
    includeList,
  })

  // Generate Markdown
  const markdownSections = flatSections.filter(
    (section): section is ICommonMarkdown => section.type === 'markdown'
  )
  const markdownContent = await generateRefMarkdown(markdownSections, libraryPath)

  return {
    props: {
      docs: markdownContent,
      flatSections,
      menuData,
    },
  }
}

const getGenericRefStaticPaths = ({ flatSections }: { flatSections: Array<ICommonSection> }) => {
  // In production, generate static pages for every sub-section (better SEO)
  return {
    paths: flatSections.map((section) => {
      return {
        params: {
          slug: [section.slug],
        },
      }
    }),
    fallback: 'blocking' as const,
  }
}

export { getGenericRefStaticProps, getGenericRefStaticPaths }
