import { getContentListingById } from '~/lib/content-listings.utils'
import type { Heading, Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx'
import { toString } from 'mdast-util-to-string'
import { getAnchor } from 'ui'
import { visit } from 'unist-util-visit'

type IdTarget = Heading | MdxJsxFlowElement

// the same input `Heading` passes to `getAnchor`, so the base id matches the rendered one
const getHeadingAnchor = (heading: Heading) => {
  const [onlyChild] = heading.children
  if (heading.children.length === 1 && onlyChild.type === 'text') return getAnchor(onlyChild.value)
  return getAnchor(
    heading.children.map((child) =>
      child.type === 'text' ? child.value : { props: { children: toString(child) } }
    )
  )
}

const getListingAnchor = (element: MdxJsxFlowElement) => {
  const listingId = element.attributes.find(
    (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'id'
  )?.value
  if (typeof listingId !== 'string') return undefined
  const heading = getContentListingById(listingId)?.heading
  return heading ? getAnchor(heading) : undefined
}

const setAnchor = (node: IdTarget, id: string) => {
  if (node.type === 'heading') {
    node.data = { ...node.data, hProperties: { id } }
    return
  }
  node.attributes.push({ type: 'mdxJsxAttribute', name: 'headingId', value: id })
}

/**
 * Gives each repeated heading on a page a unique id. The first heading keeps the id from its
 * text, so existing links still work. Each repeat gets the next free `-1`, `-2` suffix.
 */
export const remarkUniqueHeadingIds = () => (root: Root) => {
  const targets: { node: IdTarget; anchor: string }[] = []
  visit(root, (node) => {
    // the levels that the docs render with `Heading`, which sets an id
    if (node.type === 'heading' && [2, 3, 4].includes(node.depth)) {
      const anchor = getHeadingAnchor(node)
      if (anchor) targets.push({ node, anchor })
    }
    if (node.type === 'mdxJsxFlowElement' && node.name === 'ContentListings') {
      const anchor = getListingAnchor(node)
      if (anchor) targets.push({ node, anchor })
    }
  })

  const takenAnchors = new Set(targets.map(({ anchor }) => anchor))
  const seenAnchors = new Set<string>()
  for (const { node, anchor } of targets) {
    if (!seenAnchors.has(anchor)) {
      seenAnchors.add(anchor)
      continue
    }
    let suffix = 1
    while (takenAnchors.has(`${anchor}-${suffix}`)) suffix += 1
    const uniqueAnchor = `${anchor}-${suffix}`
    takenAnchors.add(uniqueAnchor)
    setAnchor(node, uniqueAnchor)
  }
}
