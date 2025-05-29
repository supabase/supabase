import {
  type FragmentDefinitionNode,
  GraphQLError,
  type SelectionNode,
  type ValidationContext,
  type ValidationRule,
} from 'graphql'

/**
 * Creates a validator that limits the depth of a GraphQL query.
 *
 * @param maxDepth The maximum allowed depth
 * @returns A validation rule that enforces depth limits
 */
export function createQueryDepthLimiter(maxDepth: number): ValidationRule {
  const fragmentDepthMap = new Map<string, number>()

  return function limitQueryDepth(context) {
    return {
      Document: {
        leave() {
          fragmentDepthMap.clear()
        },
      },
      Field: {
        enter(node, _key, _parent, path, ancestors) {
          // Skip __typename and introspection fields
          if (node.name.value === '__typename' || node.name.value.startsWith('__')) {
            return
          }

          // Calculate the depth by counting the ancestors that are field nodes
          const fieldAncestors = ancestors.filter(
            (ancestor) => ancestor && 'kind' in ancestor && ancestor.kind === 'Field'
          )
          const depth = fieldAncestors.length + 1

          // Check if this field exceeds the maximum maxDepth
          if (depth > maxDepth) {
            const pathStr = path.join('.')
            context.reportError(
              new GraphQLError(
                `Query exceeds maximum depth of ${maxDepth}. Got depth ${depth} for ${pathStr}.`,
                { nodes: node }
              )
            )
          }
        },
      },
      FragmentDefinition: {
        enter(node) {
          calculateFragmentDepth(node, context, 0, fragmentDepthMap, maxDepth)
          const depth = fragmentDepthMap.get(node.name.value)!

          if (depth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Fragment "${node.name.value}" exceeds maximum depth of ${maxDepth}.`,
                { nodes: node }
              )
            )
          }
        },
      },
      FragmentSpread: {
        enter(node, _key, _parent, _path, ancestors) {
          const fragmentName = node.name.value
          const fragmentDepth = fragmentDepthMap.get(fragmentName) || 0

          const fieldAncestors = ancestors.filter(
            (ancestor) => ancestor && 'kind' in ancestor && ancestor.kind === 'Field'
          )
          const currentDepth = fieldAncestors.length

          const totalDepth = currentDepth + fragmentDepth

          if (totalDepth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Fragment spread "${fragmentName}" causes query to exceed maximum depth of ${maxDepth}.`,
                { nodes: node }
              )
            )
          }
        },
      },
    }
  }
}

/**
 * Helper function to calculate the depth of a fragment
 */
function calculateFragmentDepth(
  node: FragmentDefinitionNode,
  context: ValidationContext,
  currentDepth: number,
  visitedFragments: Map<string, number>,
  maxDepth: number
) {
  const fragmentName = node.name.value
  if (visitedFragments.has(fragmentName)) {
    return
  }

  let maxFragmentDepth = 0
  // Process all selections in the fragment
  function processSelections(selections: ReadonlyArray<SelectionNode>, depth: number) {
    for (const selection of selections) {
      if (selection.kind === 'Field') {
        // Skip __typename and introspection fields
        if (selection.name.value === '__typename' || selection.name.value.startsWith('__')) {
          continue
        }

        const newDepth = depth + 1
        if (newDepth > maxFragmentDepth) {
          maxFragmentDepth = newDepth
        }
        if (maxFragmentDepth > maxDepth) {
          // Do not recurse anymore because we might go on indefinitely
          continue
        }

        // If there are nested selections, process them
        if (selection.selectionSet) {
          processSelections(selection.selectionSet.selections, newDepth)
        }
      } else if (selection.kind === 'FragmentSpread') {
        // Process fragment spreads
        const spreadName = selection.name.value
        const fragment = context.getFragment(spreadName)
        if (!fragment) continue

        const fragmentName = fragment.name.value
        if (!visitedFragments.has(fragmentName)) {
          calculateFragmentDepth(fragment, context, depth, visitedFragments, maxDepth)
        }
        const fragmentDepth = visitedFragments.get(fragmentName)!
        const totalDepth = fragmentDepth + depth

        if (totalDepth > maxFragmentDepth) {
          maxFragmentDepth = totalDepth
        }
      } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
        // Process inline fragments
        processSelections(selection.selectionSet.selections, depth)
      }
    }
  }

  if (node.selectionSet) {
    processSelections(node.selectionSet.selections, currentDepth)
  }

  visitedFragments.set(fragmentName, maxFragmentDepth)
}
