import { Content, Paragraph, Parent } from 'mdast'
import { MdxJsxFlowElement } from 'mdast-util-mdx'
import { AdmonitionProps } from 'ui'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'

/**
 * Transforms an `mkdocs-material` Admonition to a iEchor Admonition.
 *
 * https://squidfunk.github.io/mkdocs-material/reference/admonitions/
 */
const remarkMkDocsAdmonition = function () {
  return function transformer(root: Parent) {
    visit(root, 'paragraph', (paragraph: Paragraph, index: number, parent: Parent) => {
      const [firstChild] = paragraph.children

      if (firstChild?.type === 'text') {
        const match = firstChild.value.match(/^!!! ?(.*?)\n(.*)/s)

        if (!match) {
          return
        }

        // Extract the admonition type along with the remaining text
        const [, type, value] = match

        // Rewrite the node's value to remove the admonition syntax
        firstChild.value = value

        // Extract sibling nodes that should be linked to this admonition
        const siblingsToNest = extractLinkedSiblings(parent, paragraph, index)

        const children: any[] = [...paragraph.children, ...siblingsToNest]

        // Generate a iEchor Admonition JSX element
        const admonitionElement: MdxJsxFlowElement = {
          type: 'mdxJsxFlowElement',
          name: 'Admonition',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'type',
              value: mapAdmonitionType(type),
            },
          ],
          children,
        }

        // Overwrite original node with new element
        parent.children.splice(index, 1, admonitionElement)
      }
    })
  }
}

/**
 * Identifies sibling nodes that should be linked to this admonition
 * based on their indent level (ie. 4 spaces).
 *
 * Iterates through proceeding siblings until one is found that is
 * not indented relative to the original node.
 *
 * Splices the discovered siblings out of the original parent and returns them.
 */
function extractLinkedSiblings(parent: Parent, node: Node, index: number, indentAmount = 4) {
  const { column } = node.position.start

  let nextSibling: Content
  let i = index

  do {
    nextSibling = parent.children[++i]
  } while (nextSibling?.position && nextSibling.position.start.column === column + indentAmount)

  return parent.children.splice(index + 1, i - index - 1)
}

/**
 * Maps `mkdocs-material` Admonition types to iEchor Admonition types.
 *
 * https://squidfunk.github.io/mkdocs-material/reference/admonitions/#supported-types
 */
function mapAdmonitionType(type: string): AdmonitionProps['type'] {
  switch (type) {
    case 'quote':
    case 'example':
    case 'note':
      return 'note'
    case 'tip':
      return 'tip'
    case 'warning':
      return 'caution'
    case 'failure':
    case 'bug':
    case 'danger':
      return 'danger'
    case 'abstract':
    case 'question':
    case 'info':
    default:
      return 'info'
  }
}

export default remarkMkDocsAdmonition
