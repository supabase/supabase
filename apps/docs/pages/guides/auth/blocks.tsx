import { type GetStaticPaths, type GetStaticProps, type InferGetStaticPropsType } from 'next'
// import { MDXRemote } from 'next-mdx-remote'

// import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
// import { getGuidesStaticPaths, getGuidesStaticProps } from '~/lib/docs'
import { getAllBlockIds } from '~/lib/blocks'
import { getBlock } from '~/lib/blocks'
import { useState } from 'react'

// import { styles } from '~/registry/styles'
import { BlockPreview } from '~/components/block-preview'
import { useConfig } from '~/hooks/useConfig'
import { BlockDisplay } from '~/components/block-display'
import { frameworks } from '~/registry/frameworks'

export const getStaticProps = async (args) => {
  //   return getGuidesStaticProps('auth', args)

  // let blocks = {}

  const blocks = await Promise.all(
    frameworks.map(async (framework) => {
      const blockIds = await getAllBlockIds(framework.name)
      const blocks = await Promise.all(
        blockIds.map(async (name) => {
          const block = await getBlock(name, framework.name)
          // Cannot (and don't need to) pass component to the client.
          delete block?.component
          return block
        })
      )
      return { [framework.name]: blocks }
    })
  )

  const formattedBlocks = blocks.reduce((acc, cur) => {
    return { ...acc, ...cur }
  }, {})

  console.log('blocks', formattedBlocks)

  return { props: { blocks: formattedBlocks } }
}

export default function AuthGuide({
  //   frontmatter,
  //   mdxSource,
  //   editLink,
  blocks,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  //   const { hideToc, ...meta } = frontmatter

  const [config] = useConfig()

  const [isLoading, setIsLoading] = useState(true)

  console.log('config', config)

  return (
    <Layout
      meta={{ title: 'Auth UI Blocks' }}
      hideToc={false}
      //   editLink={editLink}
      menuId={MenuId.Auth}
    >
      <p>This is an example of some blocks:</p>
      <div className="flex flex-col gap-[100px]">
        {blocks[config.framework].map((block, index) => {
          return <BlockPreview key={`${block.name}-${index}`} block={block} />
        })}
      </div>
    </Layout>
  )
}
