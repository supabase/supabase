import {
  IRefStaticDoc,
  type ICommonMarkdown,
  type ICommonSection,
} from '~/components/reference/Reference.types'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

const getGenericRefStaticProps = async ({
  flatSections,
  libraryPath,
}: {
  flatSections: Array<ICommonSection>
  libraryPath: `/${string}`
}) => {
  // Generate Markdown
  const markdownSections = flatSections.filter(
    (section): section is ICommonMarkdown => section.type === 'markdown'
  )
  const markdownContent = await generateRefMarkdown(markdownSections, libraryPath)

  return {
    props: {
      docs: markdownContent as Array<IRefStaticDoc>,
    },
  }
}

const getGenericRefStaticPaths = ({ flatSections }: { flatSections: Array<ICommonSection> }) => {
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
