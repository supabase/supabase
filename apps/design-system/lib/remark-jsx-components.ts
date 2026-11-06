import { visit } from 'unist-util-visit'

// Matches self-closing JSX-like elements with PascalCase component names:
//   <ComponentName />
//   <ComponentName service="auth" />
const JSX_SELF_CLOSING = /^<([A-Z]\w*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/>$/
const ATTR_PATTERN = /([\w-]+)(?:="([^"]*)")?/g

/**
 * Remark plugin that converts JSX-like self-closing tags (e.g. `<ErrorCodes service="auth" />`)
 * in markdown into nodes that react-markdown maps to entries in the `components` prop —
 * giving the ui-patterns `Markdown` component MDX-like behavior in design-system demos.
 */
export const remarkJsxComponents = () => (tree: any) => {
  visit(tree, 'html', (node: any, index: number | undefined, parent: any) => {
    if (!parent || index === undefined) return
    const match = node.value.trim().match(JSX_SELF_CLOSING)
    if (!match) return

    const [, name, attrsStr] = match
    const properties: Record<string, string | boolean> = {}
    ATTR_PATTERN.lastIndex = 0
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = ATTR_PATTERN.exec(attrsStr || '')) !== null) {
      properties[attrMatch[1]] = attrMatch[2] !== undefined ? attrMatch[2] : true
    }

    parent.children[index] = {
      type: 'jsxComponent',
      data: { hName: name, hProperties: properties },
    }
  })
}
