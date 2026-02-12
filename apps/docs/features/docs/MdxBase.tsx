import { preprocessMdxWithDefaults } from '~/features/directives/utils'
import { components } from '~/features/docs/MdxBase.shared'
import { guidesData } from '~/lib/guidesData'
import { SerializeOptions } from '~/types/next-mdx-remote-serialize'
import { isFeatureEnabled } from 'common'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { type ComponentProps } from 'react'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

const mdxOptions: SerializeOptions = {
  blockJS: false,
  mdxOptions: {
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
    scope: { isFeatureEnabled, ...guidesData },
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
