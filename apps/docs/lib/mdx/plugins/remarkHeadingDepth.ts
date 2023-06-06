import { Heading, Paragraph, Parent } from 'mdast'
import { MdxJsxFlowElement } from 'mdast-util-mdx'
import { visit } from 'unist-util-visit'

/**
 * Shifts the depth of all headings by `shift`.
 * Headings will be capped at 6 (the maximum depth).
 *
 * @example
 * headingDepth(1) // h1 becomes h2, h2 becomes h3, etc
 */
export function headingDepth(shift = 0) {
  return function transformer(root: Parent) {
    visit(root, 'heading', (heading: Heading) => {
      heading.depth += Math.min(shift, 6)
    })
  }
}
