/**
 * The Show directive supports conditional rendering of content based on feature flags.
 * It uses the isFeatureEnabled function from the common package to determine whether
 * the content should be displayed.
 *
 * If the feature is enabled, the <$Show> tag is stripped but its children remain.
 * If the feature is disabled, both the <$Show> tag and its children are removed.
 *
 * ## Examples
 *
 * ### Basic usage
 *
 * ```mdx
 * <$Show if="feature-name">
 *   This content will only show if the feature is enabled.
 * </$Show>
 * ```
 */

import { type Root } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { type Parent } from 'unist'
import { visitParents } from 'unist-util-visit-parents'

import { isFeatureEnabled, type Feature } from 'common/enabled-features'
import { getAttributeValue } from './utils.server'

export function showRemark() {
  return function transform(tree: Root) {
    const nodesToProcess = [] as Array<{
      node: MdxJsxFlowElement
      parent: Parent
      shouldShow: boolean
    }>

    // Collect all $Show nodes and determine their visibility
    visitParents(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, ancestors) => {
      if (node.name !== '$Show') return

      const parent = ancestors[ancestors.length - 1]
      const rawFeatureName = getAttributeValue(node, 'if')

      if (typeof rawFeatureName !== 'string') {
        throw new Error('$Show directive requires a string value for the "if" attribute')
      }

      const trimmedFeatureName = rawFeatureName.trim()
      const isNegated = trimmedFeatureName.startsWith('!')
      const normalizedFeatureName = (
        isNegated ? trimmedFeatureName.slice(1) : trimmedFeatureName
      ).trim()

      if (!normalizedFeatureName) {
        throw new Error('$Show directive requires a non-empty feature name for the "if" attribute')
      }

      const isEnabled = isFeatureEnabled(normalizedFeatureName as Feature)
      const shouldShow = isNegated ? !isEnabled : isEnabled

      nodesToProcess.push({
        node,
        parent,
        shouldShow,
      })
    })

    // Process nodes in reverse order to avoid index shifting issues
    for (let i = nodesToProcess.length - 1; i >= 0; i--) {
      const { node, parent, shouldShow } = nodesToProcess[i]
      const nodeIndex = parent.children.indexOf(node)

      if (shouldShow) {
        // Feature is enabled: remove the $Show wrapper but keep children
        parent.children.splice(nodeIndex, 1, ...node.children)
      } else {
        // Feature is disabled: remove the entire $Show element and its children
        parent.children.splice(nodeIndex, 1)
      }
    }

    return tree
  }
}
