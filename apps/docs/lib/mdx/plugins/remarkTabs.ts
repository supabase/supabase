import { Content, Paragraph, Parent } from 'mdast'
import { MdxJsxFlowElement } from 'mdast-util-mdx'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'

/**
 * Transforms PyMdown Tabs to Supabase Tabs.
 *
 * https://facelessuser.github.io/pymdown-extensions/extensions/tabbed/
 */
const remarkPyMdownTabs = function () {
  return function transformer(root: Parent) {
    visit(root, 'paragraph', (node: Paragraph, nodeIndex: number, parent: Parent) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (child.type !== 'text') {
          continue
        }

        // Look for 3 '=', followed by an optionally quoted title,
        // followed by optional newlines of text
        const match = child.value.match(/^\n*=== ("?)(.+)\1\n?((?:.|\n)*)/)

        if (!match) {
          continue
        }

        // Extract the tab title along with the remaining text
        const [, , title, value] = match

        // Rewrite the node's value to remove the tab syntax
        child.value = value

        // Extract sibling nodes that should be linked to this tab
        const siblingsToNest = extractLinkedSiblings(parent, node, nodeIndex)

        const children: any[] = [...node.children.slice(i), ...siblingsToNest]

        const tabPanelElement: MdxJsxFlowElement = {
          type: 'mdxJsxFlowElement',
          name: 'TabPanel',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'id',
              value: title,
            },
            {
              type: 'mdxJsxAttribute',
              name: 'label',
              value: title,
            },
          ],
          children,
        }

        let nodesAdded = 0
        const previousNode = parent.children[nodeIndex - 1]

        if (previousNode?.type === 'mdxJsxFlowElement' && previousNode.name === 'Tabs') {
          // Add TabPanel to existing Tabs component
          previousNode.children.push(tabPanelElement)

          // Remove this node
          parent.children.splice(nodeIndex, 1)
          nodesAdded--
        } else {
          // Create new Tabs components and add TabPanel
          const tabsElement: MdxJsxFlowElement = {
            type: 'mdxJsxFlowElement',
            name: 'Tabs',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'scrollable',
              },
              {
                type: 'mdxJsxAttribute',
                name: 'size',
                value: 'small',
              },
              {
                type: 'mdxJsxAttribute',
                name: 'type',
                value: 'underlined',
              },
            ],
            children: [tabPanelElement],
          }

          // Overwrite this paragraph node with Tabs component
          parent.children.splice(nodeIndex, 1, tabsElement)
        }

        // If this wasn't the first child of the paragraph, create
        // a new paragraph before this with the previous text children
        if (i > 0) {
          const previousChildren = node.children.slice(0, i)
          const paragraph: Paragraph = {
            type: 'paragraph',
            children: previousChildren,
          }
          parent.children.splice(nodeIndex, 0, paragraph)

          nodesAdded++
        }

        // Return the correct index for the next visit, since
        // we may have added or removed an element in the array
        return nodeIndex + nodesAdded
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

export default remarkPyMdownTabs
