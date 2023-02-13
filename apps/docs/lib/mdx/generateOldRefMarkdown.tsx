import { serialize } from 'next-mdx-remote/serialize'

import toc from 'markdown-toc'

import { getDocsBySlug } from '~/lib/docs'

async function generateOldRefMarkdown(slug) {
  let doc = getDocsBySlug(slug)
  const content = await serialize(doc.content ?? '', {
    // MDX's available options, see the MDX docs for more info.
    // https://mdxjs.com/packages/mdx/#compilefile-options
    // Indicates whether or not to parse the frontmatter from the mdx source
  })
  return {
    props: {
      /*
       * old reference docs are below
       */
      ...doc,
      content,
      toc: toc(doc.content, { maxdepth: 1, firsth1: false }),
    },
  }
}

export default generateOldRefMarkdown
