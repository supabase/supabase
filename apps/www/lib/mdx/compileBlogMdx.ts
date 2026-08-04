import { compile, run } from '@mdx-js/mdx'
import type { ReactElement } from 'react'
import * as runtime from 'react/jsx-runtime'

import { mdxOptionsBlog } from './mdxOptionsBlog'

export async function compileBlogMdx(
  source: string,
  components: Record<string, unknown>
): Promise<ReactElement> {
  const compiled = await compile(source, {
    outputFormat: 'function-body',
    development: false,
    remarkPlugins: mdxOptionsBlog.remarkPlugins,
    rehypePlugins: mdxOptionsBlog.rehypePlugins,
  })
  const { default: MDXContent } = await run(String(compiled), {
    ...(runtime as any),
    baseUrl: import.meta.url,
  })
  return MDXContent({ components: components as any })
}
