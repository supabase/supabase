import { getAllBlockIds } from '~/lib/blocks'
import { BlockDisplay } from '~/components/block-display'
import Layout from '~/layouts/DefaultGuideLayoutAppRouter'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'

// export const getStaticProps = async (args) => {
//   const blocks = await getAllBlockIds()

//   return { props: { blocks } }
// }

export default async function BlocksPage() {
  const blocks = await getAllBlockIds()

  console.log('blocks', blocks)

  return blocks.map((name, index) => {
    return (
      // <Layout
      //   //   meta={meta}
      //   meta={{ title: 'Blocks' }}
      //   hideToc={true}
      //   // editLink={editLink}
      //   menuId={MenuId.Auth}
      // >
      <BlockDisplay key={`${name}-${index}`} name={name} />
      // </Layout>
    )
  })
}
