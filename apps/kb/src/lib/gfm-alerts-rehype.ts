import { visit } from 'unist-util-visit'

/**
 * Bridges remark-github-markdown-alerts' "component mode" output — a plain
 * `<div class="markdown-alert markdown-alert-{type}" data-alert-type="{type}">`
 * wrapping a title node and a content node (see its createAlertComponent) —
 * into an actual `<GfmAlert type="{type}">` MDX component invocation, which
 * renders the real `Admonition` component. See src/components/GfmAlert.tsx.
 *
 * Runs as a rehype plugin (after remark-github-markdown-alerts has already
 * turned the blockquote into that div, and before MDX compiles the hast tree
 * to JS), swapping the div node for an `mdxJsxFlowElement` — the same hast
 * node shape MDX itself uses for JSX written directly in the file.
 */
export function rehypeGfmAlertsToComponent() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'div' || typeof index !== 'number' || !parent) return

      const type = node.properties?.dataAlertType
      if (!type) return

      // createAlertComponent always emits exactly [titleNode, contentNode] —
      // we only want the content, Admonition renders its own title/icon.
      const content = node.children[1]

      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'GfmAlert',
        attributes: [{ type: 'mdxJsxAttribute', name: 'type', value: type }],
        children: content?.children ?? [],
      }
    })
  }
}
