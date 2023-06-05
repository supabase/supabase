import { Parent } from 'mdast'

/**
 * Removes the top heading from a MD file if
 * it is the first node and it matches `title`.
 *
 * Useful when rendering title separately from MD
 * and you need to remove the duplicate.
 */
export function removeTitle(title: string) {
  return function transformer(root: Parent) {
    const [firstNode] = root.children

    if (firstNode?.type === 'heading') {
      const [text] = firstNode.children

      if (text?.type === 'text' && text.value === title) {
        // Remove this node
        root.children.splice(0, 1)
      }
    }
  }
}
