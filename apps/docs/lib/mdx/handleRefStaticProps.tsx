import { ICommonMarkdown, ICommonSection } from '~/components/reference/Reference.types'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

async function handleRefStaticProps(sections: ICommonSection[], libraryPath: string) {
  const markdownSections = sections.filter(
    (section): section is ICommonMarkdown => section.type === 'markdown'
  )
  const markdownContent = await generateRefMarkdown(markdownSections, libraryPath)

  return {
    props: {
      docs: markdownContent,
    },
  }
}

export default handleRefStaticProps
