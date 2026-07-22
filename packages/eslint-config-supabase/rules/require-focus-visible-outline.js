/**
 * ESLint rule banning bare `outline-none` / `outline-hidden` Tailwind classes.
 *
 * Removing the default focus outline without a visible replacement hides keyboard
 * focus from sighted users. Prefer the shared `focus-ring` or `focus-inset`
 * utilities (or an explicit ring/outline on :focus-visible) so interactive
 * controls stay visible when tabbing.
 *
 * BAD:
 *   <button className="outline-none">Save</button>
 *   <div className="outline-hidden hover:bg-accent">Item</div>
 *
 * GOOD:
 *   <button className="focus-ring outline-none">Save</button>
 *   <input className="focus-visible:outline-none focus-visible:ring-2" />
 *   <div className="focus-inset outline-hidden">Row</div>
 */

const CLASSNAME_UTILS = new Set(['cn', 'clsx', 'classNames', 'twMerge', 'cva'])

/** @param {import('estree').Node | null | undefined} node */
function extractClassStrings(node) {
  /** @type {string[]} */
  const strings = []

  if (!node) return strings

  if (node.type === 'Literal' && typeof node.value === 'string') {
    strings.push(node.value)
    return strings
  }

  if (node.type === 'TemplateLiteral') {
    const staticParts = node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join(' ')
    if (staticParts.trim()) {
      strings.push(staticParts)
    }
    for (const expression of node.expressions) {
      strings.push(...extractClassStrings(expression))
    }
    return strings
  }

  if (node.type === 'CallExpression') {
    const calleeName = getCalleeName(node.callee)
    if (calleeName && CLASSNAME_UTILS.has(calleeName)) {
      for (const arg of node.arguments) {
        strings.push(...extractClassStrings(arg))
      }
    }
    return strings
  }

  if (node.type === 'ConditionalExpression') {
    strings.push(...extractClassStrings(node.consequent))
    strings.push(...extractClassStrings(node.alternate))
    return strings
  }

  if (node.type === 'LogicalExpression') {
    strings.push(...extractClassStrings(node.left))
    strings.push(...extractClassStrings(node.right))
    return strings
  }

  if (node.type === 'ArrayExpression') {
    for (const element of node.elements) {
      if (element) {
        strings.push(...extractClassStrings(element))
      }
    }
    return strings
  }

  return strings
}

/** @param {import('estree').Node} callee */
function getCalleeName(callee) {
  if (callee.type === 'Identifier') {
    return callee.name
  }
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    return callee.property.name
  }
  return null
}

/** @param {import('estree').Node} attr */
function getClassNameStrings(attr) {
  if (attr.type !== 'JSXAttribute') return []
  if (attr.name.type !== 'JSXIdentifier' || attr.name.name !== 'className') return []

  const value = attr.value
  if (!value) return []

  if (value.type === 'Literal') {
    return extractClassStrings(value)
  }

  if (value.type === 'JSXExpressionContainer') {
    return extractClassStrings(value.expression)
  }

  return []
}

/** @param {string} classString */
function tokenizeClasses(classString) {
  return classString.split(/\s+/).filter(Boolean)
}

/** @param {string} token */
function normalizeToken(token) {
  return token.replace(/!+$/, '')
}

/** @param {string} token */
function isOutlineNoneOrHiddenToken(token) {
  const normalized = normalizeToken(token)
  return /(?:^|:)outline-(?:none|hidden)$/.test(normalized)
}

/** @param {string} classString */
function hasBareOutlineClass(classString) {
  return tokenizeClasses(classString).some(isOutlineNoneOrHiddenToken)
}

/** @param {string} token */
function isApprovedFocusOutlineReplacement(token) {
  const normalized = normalizeToken(token)

  if (normalized === 'focus-ring' || normalized === 'focus-inset') {
    return true
  }
  if (/focus-visible:ring-/.test(normalized)) {
    return true
  }
  if (/focus:ring-/.test(normalized)) {
    return true
  }
  if (/group-focus-visible:ring-/.test(normalized)) {
    return true
  }
  if (/group-focus-visible:outline-(?!none(?:$|-)|hidden(?:$|-))/.test(normalized)) {
    return true
  }
  if (/focus-visible:outline-(?!none(?:$|-)|hidden(?:$|-))/.test(normalized)) {
    return true
  }
  if (/focus:outline-(?!none(?:$|-)|hidden(?:$|-))/.test(normalized)) {
    return true
  }
  if (/has-\[[^\]]+\]:ring-/.test(normalized)) {
    return true
  }
  if (/has-\[[^\]]*focus-visible:ring/.test(normalized)) {
    return true
  }
  if (/has-\[:focus-visible\]/.test(normalized)) {
    return true
  }

  return false
}

/** @param {string} classString */
function hasApprovedFocusReplacement(classString) {
  if (/\bfocus-ring\b/.test(classString) || /\bfocus-inset\b/.test(classString)) {
    return true
  }

  return tokenizeClasses(classString).some(isApprovedFocusOutlineReplacement)
}

/** @param {string} classString */
function isViolation(classString) {
  if (!hasBareOutlineClass(classString)) {
    return false
  }
  return !hasApprovedFocusReplacement(classString)
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow bare outline-none/outline-hidden without an approved focus-visible replacement',
      recommended: true,
    },
    messages: {
      bareOutlineNone:
        'Avoid bare `outline-none` / `outline-hidden` without a keyboard focus indicator. Add `focus-ring` or `focus-inset`, or pair removal with `focus-visible:ring-*` / a non-none `focus-visible:outline-*`.',
    },
    schema: [],
  },

  create(context) {
    return {
      /** @param {import('estree').Node} node */
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') {
          return
        }

        const classStrings = getClassNameStrings(node)
        if (classStrings.length === 0) {
          return
        }

        const combined = classStrings.join(' ')
        if (!isViolation(combined)) {
          return
        }

        context.report({
          node,
          messageId: 'bareOutlineNone',
        })
      },
    }
  },
}
