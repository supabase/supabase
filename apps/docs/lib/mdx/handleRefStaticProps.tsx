import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

async function handleRefStaticProps(sections, librarypath, spec) {
  let markdownContent = await generateRefMarkdown(sections, librarypath, spec)

  return {
    props: {
      docs: markdownContent,
    },
  }
}

export default handleRefStaticProps
