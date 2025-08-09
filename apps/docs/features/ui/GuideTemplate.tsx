import { type ReactNode } from 'react'

import type { WithRequired } from '~/features/helpers.types'
import { EditLink } from '~/features/helpers.edit-link'
import { type GuideFrontmatter } from '~/lib/docs'
import { SerializeOptions } from '~/types/next-mdx-remote-serialize'

import { Guide, GuideArticle, GuideFooter, GuideHeader, GuideMdxContent } from './guide'

interface BaseGuideTemplateProps {
  meta?: GuideFrontmatter
  content?: string
  children?: ReactNode
  editLink: EditLink
  mdxOptions?: SerializeOptions
}

type GuideTemplateProps =
  | WithRequired<BaseGuideTemplateProps, 'children'>
  | WithRequired<BaseGuideTemplateProps, 'content'>

const GuideTemplate = ({ meta, content, children, editLink, mdxOptions }: GuideTemplateProps) => {
  return (
    <Guide meta={meta}>
      <GuideArticle>
        <GuideHeader />
        <GuideMdxContent content={content} mdxOptions={mdxOptions}></GuideMdxContent>
        {children}
        <GuideFooter editLink={editLink} />
      </GuideArticle>
    </Guide>
  )
}

export { GuideTemplate }
