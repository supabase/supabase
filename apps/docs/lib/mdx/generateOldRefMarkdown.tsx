import { serialize } from 'next-mdx-remote/serialize'

import { remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from '~/codeHikeTheme.js'

import toc from 'markdown-toc'

import { getDocsBySlug } from '~/lib/docs'

// @ts-ignore
// @ts-ignore

async function generateOldRefMarkdown(slug) {
  let doc = getDocsBySlug(slug)
  const content = await serialize(doc.content ?? '', {
    // MDX's available options, see the MDX docs for more info.
    // https://mdxjs.com/packages/mdx/#compilefile-options
    mdxOptions: {
      remarkPlugins: [[remarkCodeHike, { autoImport: false, codeHikeTheme, showCopyButton: true }]],
      useDynamicImport: true,
    },
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
