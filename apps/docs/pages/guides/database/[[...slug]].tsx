import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'

import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
import { getGuidesStaticPaths, getGuidesStaticProps } from '~/lib/docs'

export const getStaticPaths = (async () => {
  const paths = await getGuidesStaticPaths('database')

  /**
   * Wrappers is special, so remove it
   * Needs to be handled within its own subdirectory or won't build on dev
   */
  paths.paths = paths.paths.filter(
    ({ params }) => !(params.slug.at(0) === 'extensions' && params.slug.at(1) === 'wrappers')
  )

  return paths
}) satisfies GetStaticPaths

export const getStaticProps = (async (args) => {
  return getGuidesStaticProps('database', args)
}) satisfies GetStaticProps

export default function DatabaseGuide({
  frontmatter,
  mdxSource,
  editLink,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { hideToc, ...meta } = frontmatter

  return (
    <Layout meta={meta} hideToc={hideToc} editLink={editLink} menuId={MenuId.Database}>
      <MDXRemote {...mdxSource} components={components} />
    </Layout>
  )
}
