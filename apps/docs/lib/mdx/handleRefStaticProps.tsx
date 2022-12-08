import generateOldRefMarkdown from '~/lib/mdx/generateOldRefMarkdown'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

async function handleRefStaticProps(sections, params, librarypath, urlPath) {
  let markdownContent = await generateRefMarkdown(sections, librarypath)

  console.log(markdownContent)

  /*
   * old content generation
   * this is for grabbing to old markdown files
   */

  let slug
  if (params.slug.length > 1) {
    slug = `docs/reference${urlPath}/${params.slug.join('/')}`
  } else {
    slug = `docs/reference${urlPath}/${params.slug[0]}`
  }

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    const oldMarkdown = await generateOldRefMarkdown(slug)
    return oldMarkdown
  } else {
    return {
      props: {
        docs: markdownContent,
      },
    }
  }
}

export default handleRefStaticProps
