import { getBlock } from '~/lib/blocks'
import { BlockPreview } from '~/components/block-preview'
import { styles } from '~/registry/styles'
import { Block } from '~/registry/schema'

export async function BlockDisplay({ name, blocks }: { name: string; blocks: Block[] }) {
  const _blocks = await Promise.all(
    styles.map(async (style) => {
      // const block = await getBlock(name, style.name)
      // Cannot (and don't need to) pass component to the client.
      // delete block?.component
      // return block
      return <p>something</p>
    })
  )

  if (!_blocks?.length) {
    return null
  }

  // return _blocks.map((block) => <BlockPreview key={`${block.style}-${block.name}`} block={block} />)
  return <h1>block here</h1>
}
