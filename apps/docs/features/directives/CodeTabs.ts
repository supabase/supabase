/**
 * The CodeTabs directive supports displaying a set of sequential code blocks
 * as tabbed files.
 *
 * The syntax is:
 *
 * ````mdx
 * <$CodeTabs>
 *
 * ```js name=a.js
 * console.log('file a')
 * ```
 *
 * ```js name=b.js
 * console.log('file b')
 * ```
 *
 * <$/CodeTabs>
 * ````
 */

import { type Parent, type Code, type Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visitParents } from 'unist-util-visit-parents'

import { isCodeSampleWrapper } from './CodeSample'

export function codeTabsRemark() {
  return function transform(tree: Root) {
    rewriteNodes(tree)
    return tree
  }
}

function rewriteNodes(tree: Root) {
  visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors: Array<Parent>) => {
    if (node.name !== '$CodeTabs') return
    if (node.children.some((child) => child.type !== 'code' && !isCodeSampleWrapper(child))) {
      throw new Error(
        `CodeTabs must contain only code blocks and code sample wrappers, found:\n\n${JSON.stringify(node.children, null, 2)}`
      )
    }

    const parent = ancestors[ancestors.length - 1]
    const remappedChildren = node.children.map(
      (code: Code | MdxJsxFlowElement, idx): MdxJsxFlowElement => {
        const file = getFileName(code)
        return {
          type: 'mdxJsxFlowElement',
          name: 'TabPanel',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'id',
              value: file || `File ${idx + 1}`,
            },
            {
              type: 'mdxJsxAttribute',
              name: 'label',
              value: file || `File ${idx + 1}`,
            },
          ],
          children: [code],
        }
      }
    )
    const tabsWrapper: MdxJsxFlowElement = {
      type: 'mdxJsxFlowElement',
      name: 'Tabs',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'listClassNames',
          value: 'flex-nowrap overflow-x-auto',
        },
      ],
      children: remappedChildren,
    }

    parent.children.splice(parent.children.indexOf(node), 1, tabsWrapper)
  })
}

function getFileName(node: Code | MdxJsxFlowElement): string | undefined {
  const code = node.type === 'code' ? node : (node.children[0] as Code)
  return code?.meta
    ?.split(/\s+/)
    .find((meta) => meta.startsWith('name='))
    ?.split('=')[1]
}
