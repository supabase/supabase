import type { AdmonitionType } from 'ui-patterns/Admonition'

/**
 * rehype-admonitions
 *
 * Turns:
 *
 *   > [!NOTE]
 *   > Lorem ipsum dolor...
 *
 * into:
 *
 *   <Admonition type="note">
 *     <p>Lorem ipsum dolor...</p>
 *   </Admonition>
 *
 * The five official GFM alert types (github.com/.../basic-writing-and-formatting-syntax#alerts)
 * are mapped to their closest Admonition type below — Admonition has no
 * literal "tip"/"important" type, so TIP maps to the upbeat "success"
 * treatment, and IMPORTANT/WARNING split across Admonition's two escalating
 * severities ("warning" then "danger") so all five stay visually distinct.
 * Anything else is passed through lowercased, so a marker that already
 * spells out an Admonition type (e.g. "[!CAUTION]") still works verbatim.
 *
 * Notes on why this works on a *single* blockquote node:
 * Because there's no blank line between the "> [!NOTE]" line and the
 * "> Lorem ipsum..." line, remark/mdast merges them into ONE blockquote
 * containing ONE <p>, whose text is "[!NOTE]\nLorem ipsum dolor...".
 * So the plugin looks at the blockquote's first paragraph, peels the
 * "[!TYPE]" marker off its leading text node, and uses whatever is left
 * of the blockquote (the now-stripped paragraph + any other children)
 * as the Admonition's children.
 *
 * No regex is used anywhere — just startsWith/indexOf/slice/trimStart.
 * No runtime dependencies — just a manual tree walk. AST nodes are typed as
 * `any` throughout (no hast/unist dependency) since the walk only ever reads
 * a handful of duck-typed fields (type/tagName/children/value).
 *
 * Requires the MDX/rehype pipeline to preserve `mdxJsxFlowElement` nodes
 * (this is the default in @mdx-js/mdx), and an `Admonition` component
 * made available to your MDX content (via `useMDXComponents` / provider,
 * or an explicit import in the .mdx file).
 */

export default function rehypeAdmonitions() {
  return function transformer(tree: any) {
    walk(tree)
  }
}

function walk(node: any) {
  if (!node || !Array.isArray(node.children)) return

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    if (child.type === 'element' && child.tagName === 'blockquote') {
      const admonition = toAdmonition(child)
      if (admonition) {
        node.children[i] = admonition
        walk(admonition) // keep walking in case content has nested cases
        continue
      }
    }

    walk(child)
  }
}

function toAdmonition(blockquote: any) {
  const children = blockquote.children

  // Find the first element child (skip the whitespace text nodes mdast
  // inserts between the blockquote's children).
  const pIndex = children.findIndex((c: any) => c.type === 'element')
  const p = pIndex === -1 ? null : children[pIndex]
  if (!p || p.tagName !== 'p') return null

  // Find the first text node inside that paragraph — this is where the
  // "[!TYPE]" marker lives.
  const textIndex = p.children.findIndex((c: any) => c.type === 'text')
  if (textIndex === -1) return null
  const textNode = p.children[textIndex]

  const marker = parseMarker(textNode.value)
  if (!marker) return null

  // Strip the marker out of the paragraph's leading text node, leaving
  // only the admonition body behind (e.g. "Lorem ipsum dolor...").
  if (marker.rest) {
    textNode.value = marker.rest
  } else {
    p.children.splice(textIndex, 1)
  }

  // If stripping the marker left the paragraph empty, drop the paragraph
  // entirely so we don't render an empty <p></p> inside the Admonition.
  const admonitionChildren = p.children.length
    ? children
    : children.filter((_: any, i: number) => i !== pIndex)

  return {
    type: 'mdxJsxFlowElement',
    name: 'Admonition',
    attributes: [{ type: 'mdxJsxAttribute', name: 'type', value: toAdmonitionType(marker.type) }],
    children: admonitionChildren,
  }
}

// GFM alert type -> Admonition type. See the module doc comment above.
const GFM_ALERT_TYPES: Record<string, AdmonitionType> = {
  NOTE: 'note',
  TIP: 'success',
  IMPORTANT: 'warning',
  WARNING: 'danger',
  CAUTION: 'caution',
}

function toAdmonitionType(marker: string): AdmonitionType {
  const mapped = GFM_ALERT_TYPES[marker]
  if (mapped) return mapped
  // Not one of the five GFM types — assume the marker already spells out an
  // Admonition type verbatim (e.g. "[!CAUTION]"). Unlike the branch above,
  // this isn't statically checked: an unrecognized marker just becomes
  // whatever string this produces, valid Admonition type or not.
  return marker.toLowerCase() as AdmonitionType
}

// Parses a leading "[!TYPE]" marker off the start of a string, without
// using any regex.
function parseMarker(value: string) {
  const trimmed = value.trimStart()
  if (!trimmed.startsWith('[!')) return null

  const closeIndex = trimmed.indexOf(']')
  if (closeIndex === -1) return null

  const type = trimmed.slice(2, closeIndex)
  if (!type) return null

  const rest = trimmed.slice(closeIndex + 1).trimStart()
  return { type, rest }
}
