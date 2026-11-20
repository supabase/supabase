/**
 * ESLint rule requiring an explicit tabIndex on raw interactive elements.
 *
 * An explicit tabIndex={0} puts the control in sequential focus order even when
 * the user agent only tabs to text fields by default (Safari / macOS Keyboard
 * navigation). Prefer Button from `ui`, which sets this by default; when using
 * raw <button> / role="button", set tabIndex.
 *
 * BAD:
 *   <button onClick={...}>Save</button>
 *   <div role="button" onClick={...}>Save</div>
 *
 * GOOD:
 *   <button tabIndex={0} onClick={...}>Save</button>
 *   <Button onClick={...}>Save</Button>
 *   <button tabIndex={disabled ? -1 : 0} onClick={...}>Save</button>
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit tabIndex on raw <button> and role="button" elements for keyboard focus',
      recommended: true,
    },
    messages: {
      missingTabIndex:
        'Add an explicit tabIndex={0} (or -1 when disabled) for keyboard focus, or use Button from `ui` which sets it by default.',
    },
    schema: [],
  },

  create(context) {
    /**
     * @param {import('estree').Node | null | undefined} node
     * @returns {boolean}
     */
    function isButtonRole(node) {
      if (!node || node.type !== 'JSXAttribute') return false
      if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'role') return false
      const value = node.value
      if (!value) return false
      if (value.type === 'Literal' && value.value === 'button') return true
      if (
        value.type === 'JSXExpressionContainer' &&
        value.expression.type === 'Literal' &&
        value.expression.value === 'button'
      ) {
        return true
      }
      return false
    }

    /**
     * @param {import('estree').Node} openingElement
     * @returns {boolean}
     */
    function hasTabIndex(openingElement) {
      return openingElement.attributes.some(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === 'tabIndex'
      )
    }

    /**
     * @param {import('estree').Node} openingElement
     * @returns {boolean}
     */
    function shouldRequireTabIndex(openingElement) {
      const name = openingElement.name
      if (name.type === 'JSXIdentifier' && name.name === 'button') {
        return true
      }
      return openingElement.attributes.some(isButtonRole)
    }

    return {
      JSXOpeningElement(node) {
        if (!shouldRequireTabIndex(node)) return
        if (hasTabIndex(node)) return

        context.report({
          node,
          messageId: 'missingTabIndex',
        })
      },
    }
  },
}
