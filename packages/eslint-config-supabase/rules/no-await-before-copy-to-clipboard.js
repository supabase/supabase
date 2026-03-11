/**
 * ESLint rule to prevent calling copyToClipboard after an await expression.
 *
 * Safari doesn't support async clipboard operations - the clipboard write must happen
 * synchronously with the user gesture. The copyToClipboard function accepts a Promise<string>
 * to handle this, but if you await before calling it, Safari will fail.
 *
 * BAD:
 *   const data = await fetchData()
 *   copyToClipboard(data)
 *
 * GOOD:
 *   copyToClipboard(fetchData())
 *   // or
 *   copyToClipboard(fetchData().then(format))
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling copyToClipboard after an await expression (breaks Safari clipboard)',
      recommended: true,
    },
    messages: {
      noAwaitBeforeCopy:
        'Do not call copyToClipboard after an await. Safari requires clipboard operations to be synchronous with user gestures. Pass a Promise directly to copyToClipboard instead.',
    },
    schema: [],
  },

  create(context) {
    // Track await expressions per function scope
    const functionScopes = new Map()

    /**
     * Get the nearest function scope for a node
     */
    function getFunctionScope(node) {
      let current = node.parent
      while (current) {
        if (
          current.type === 'FunctionDeclaration' ||
          current.type === 'FunctionExpression' ||
          current.type === 'ArrowFunctionExpression'
        ) {
          return current
        }
        current = current.parent
      }
      return null
    }

    /**
     * Check if nodeA comes before nodeB in source order
     */
    function isBefore(nodeA, nodeB) {
      return nodeA.range[1] <= nodeB.range[0]
    }

    /**
     * Check if the await is in a path that leads to the copyToClipboard call.
     */
    function isAwaitInPathTo(awaitNode, copyNode) {
      // Simple heuristic: if the await comes before the copy in source order
      // and they're in the same function, it's likely in the execution path.
      // This may have some false positives for complex control flow, but it's
      // better to be safe for Safari compatibility.
      return isBefore(awaitNode, copyNode)
    }

    return {
      // Track when we enter a function that could be async
      ':function'(node) {
        functionScopes.set(node, { awaitExpressions: [], isAsync: node.async })
      },

      // Track when we exit a function
      ':function:exit'(node) {
        functionScopes.delete(node)
      },

      // Record all await expressions
      AwaitExpression(node) {
        const funcScope = getFunctionScope(node)
        if (funcScope && functionScopes.has(funcScope)) {
          functionScopes.get(funcScope).awaitExpressions.push(node)
        }
      },

      // Check copyToClipboard calls
      CallExpression(node) {
        // Check if this is a call to copyToClipboard
        const callee = node.callee
        let isCopyToClipboard = false

        if (callee.type === 'Identifier' && callee.name === 'copyToClipboard') {
          isCopyToClipboard = true
        } else if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'copyToClipboard'
        ) {
          isCopyToClipboard = true
        }

        if (!isCopyToClipboard) {
          return
        }

        // Find the function scope
        const funcScope = getFunctionScope(node)
        if (!funcScope || !functionScopes.has(funcScope)) {
          return
        }

        const scopeInfo = functionScopes.get(funcScope)

        // Only check async functions (only they can have await)
        if (!scopeInfo.isAsync) {
          return
        }

        // Check if any await expression comes before this copyToClipboard call
        for (const awaitExpr of scopeInfo.awaitExpressions) {
          if (isAwaitInPathTo(awaitExpr, node)) {
            context.report({
              node,
              messageId: 'noAwaitBeforeCopy',
            })
            // Only report once per call
            return
          }
        }
      },
    }
  },
}
