import { Element } from 'hast'
import { hasProperty } from 'hast-util-has-property'
import { Node } from 'unist'
import { visit } from 'unist-util-visit'

export type UrlTransformFunction = (url: string, node: Element) => string

function modify(node: Element, prop: string, fn?: UrlTransformFunction) {
  if (hasProperty(node, prop)) {
    const property = node.properties[prop]
    if (typeof property !== 'string') {
      return
    }

    node.properties[prop] = fn?.(property, node) ?? property
  }
}

/**
 * Transforms every HAST element that contains a `href` or `src`.
 * A `UrlTransformFunction` is called with the current URL. The
 * return value from this function will be used as the replacement.
 */
export function linkTransform(fn?: UrlTransformFunction) {
  return function transformer(tree: Node) {
    visit(tree, 'element', (node: Element) => {
      modify(node, 'href', fn)
      modify(node, 'src', fn)
    })
  }
}
