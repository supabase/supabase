import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { type ComponentProps } from 'react'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { AiPromptsIndex } from '~/app/guides/(with-sidebar)/getting-started/ai-prompts/[slug]/AiPromptsIndex'
import { preprocessMdxWithDefaults } from '~/features/directives/utils'
import { components } from '~/features/docs/MdxBase.shared'

const serverOnlyComponents = {
  AiPromptsIndex,
}

const codeHikeOptions: CodeHikeConfig = {
  theme: codeHikeTheme,
  lineNumbers: true,
  showCopyButton: true,
  skipLanguages: [],
  autoImport: false,
}

const mdxOptions: SerializeOptions = {
  mdxOptions: {
    useDynamicImport: true,
    remarkPlugins: [
      [remarkMath, { singleDollarTextMath: false }],
      remarkGfm,
      [remarkCodeHike, codeHikeOptions],
    ],
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
      components={{ ...components, ...serverOnlyComponents }}
      options={finalOptions}
      {...props}
    />
  )
}

export { MDXRemoteBase }
