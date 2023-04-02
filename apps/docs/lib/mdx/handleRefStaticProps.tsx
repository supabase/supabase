import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

async function handleRefStaticProps(sections, librarypath) {
  let markdownContent = await generateRefMarkdown(sections, librarypath)

  return {
    props: {
      docs: markdownContent,
    },
  }
}

export default handleRefStaticProps
