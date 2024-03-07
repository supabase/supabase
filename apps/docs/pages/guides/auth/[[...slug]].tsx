import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'

import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { type GuideRefItem } from '~/components/Navigation/NavigationMenu/NavigationMenuGuideRef'
import Layout from '~/layouts/DefaultGuideLayout'
import { getGuidesStaticPaths, getGuidesStaticProps } from '~/lib/docs'
import refItems from '~/scripts/pregenerate/generated/commonClientLibFlat-Auth.json' assert { type: 'json' }

export const getStaticPaths = (async () => {
  return getGuidesStaticPaths('auth')
}) satisfies GetStaticPaths

export const getStaticProps = (async (args) => {
  return getGuidesStaticProps('auth', args)
}) satisfies GetStaticProps

export default function AuthGuide({
  frontmatter,
  mdxSource,
  editLink,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { hideToc, ...meta } = frontmatter

  return (
    <Layout
      meta={meta}
      hideToc={hideToc}
      editLink={editLink}
      menuId={MenuId.Auth}
      menuRefData={refItems as Array<GuideRefItem>}
    >
      <MDXRemote {...mdxSource} components={components} />
    </Layout>
  )
}
