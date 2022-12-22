import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { renderToString } from 'react-dom/server'
import components from '~/components'

export async function mdxToHtml(mdx: string) {
  const mdxSource = await serialize(mdx)

  const html = renderToString(<MDXRemote {...mdxSource} components={components} />)

  return html
}
