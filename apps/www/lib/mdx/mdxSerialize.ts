import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

// mdx2 needs self-closing tags.
// dragging an image onto a Github discussion creates an <img>
// we need to fix this before running them through mdx
function addSelfClosingTags(htmlString: string): string {
  const modifiedHTML = htmlString.replace(/<img[^>]*>/g, (match) => {
    // Check if the <img> tag already has a closing slash
    if (match.endsWith('/>')) {
      return match
    } else {
      // Add slash (/) to make it self-closing
      return match.slice(0, -1) + ' />'
    }
  })

  return modifiedHTML
}

export async function mdxSerialize(source: string) {
  const formattedSource = addSelfClosingTags(source)
  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  const mdxSource: any = await serialize(formattedSource, {
    scope: {
      chCodeConfig: codeHikeOptions,
    },
    mdxOptions: {
      remarkPlugins: [[remarkCodeHike, codeHikeOptions], remarkGfm],
      rehypePlugins: [
        // @ts-ignore
        rehypeSlug, // add IDs to any h1-h6 tag that doesn't have one, using a slug made from its text
      ],
    },
  })

  return mdxSource
}
