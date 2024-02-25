import { compact } from 'lodash'

import { toClientLibraryMenu } from '~/components/Navigation/NavigationMenu/utils.server'
import { ICommonMarkdown, ICommonSection } from '~/components/reference/Reference.types'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

const handleRefStaticProps = async ({
  sections,
  spec,
  libraryPath,
  excludedName,
}: {
  sections: ICommonSection[]
  spec: any
  libraryPath: `/${string}`
  excludedName: string
}) => {
  // Generate nav menu
  const includedFns = compact(
    (spec.functions ?? []).map(<T extends object>(fn: T) => ('id' in fn ? fn.id : null))
  ) as Array<string>
  const menuData = toClientLibraryMenu({
    excludedName,
    sectionPath: libraryPath,
    includedFunctions: includedFns,
  })

  // Generate Markdown
  const markdownSections = sections.filter(
    (section): section is ICommonMarkdown => section.type === 'markdown'
  )
  const markdownContent = await generateRefMarkdown(markdownSections, libraryPath)

  return {
    props: {
      docs: markdownContent,
      menuData,
    },
  }
}

export { handleRefStaticProps }
