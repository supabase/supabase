import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { SerializeOptions } from '~/types/next-mdx-remote-serialize'

interface GuideArticleProps {
  content: string
  mdxOptions: SerializeOptions
}

export function GuideMdxContent({ content, mdxOptions }: GuideArticleProps) {
  return <MDXRemoteBase source={content} options={mdxOptions} />
}

GuideMdxContent.displayName = 'GuideMdxContent'
