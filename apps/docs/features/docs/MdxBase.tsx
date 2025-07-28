import { MDXRemote } from 'next-mdx-remote/rsc'
import { type ComponentProps } from 'react'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { preprocessMdxWithDefaults } from '~/features/directives/utils'
import { components } from '~/features/docs/MdxBase.shared'
import { SerializeOptions } from '~/types/next-mdx-remote-serialize'

const mdxOptions: SerializeOptions = {
  mdxOptions: {
    useDynamicImport: true,
    remarkPlugins: [[remarkMath, { singleDollarTextMath: false }], remarkGfm],
    rehypePlugins: [rehypeKatex as any],
  },
}

const MDXRemoteBase = async ({
  source,
  options = {},
  customPreprocess,
  ...props
}: ComponentProps<typeof MDXRemote> & {
  source: string
  customPreprocess?: (mdx: string) => string | Promise<string>
}) => {
  const preprocess = customPreprocess ?? preprocessMdxWithDefaults
  const preprocessedSource = await preprocess(source)

  const { mdxOptions: { remarkPlugins, rehypePlugins, ...otherMdxOptions } = {}, ...otherOptions } =
    options
  const {
    mdxOptions: {
      remarkPlugins: originalRemarkPlugins,
      rehypePlugins: originalRehypePlugins,
      ...originalMdxOptions
    } = {},
  } = mdxOptions

  const finalOptions = {
    ...mdxOptions,
    ...otherOptions,
    mdxOptions: {
      ...originalMdxOptions,
      ...otherMdxOptions,
      remarkPlugins: [...(originalRemarkPlugins ?? []), ...(remarkPlugins ?? [])],
      rehypePlugins: [...(originalRehypePlugins ?? []), ...(rehypePlugins ?? [])],
    },
  } as SerializeOptions

  return (
    <MDXRemote
      source={preprocessedSource}
      components={components}
      options={finalOptions}
      {...props}
    />
  )
}

export { MDXRemoteBase }
