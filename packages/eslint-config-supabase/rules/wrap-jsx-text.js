const TEXT_CONTAINERS = new Set([
  'a',
  'abbr',
  'article',
  'aside',
  'b',
  'blockquote',
  'button',
  'dd',
  'del',
  'details',
  'div',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'i',
  'ins',
  'label',
  'li',
  'main',
  'mark',
  'nav',
  'p',
  's',
  'section',
  'small',
  'span',
  'strong',
  'summary',
  'td',
  'th',
  'u',
])

const RESTRICTED_ANCESTORS = new Set([
  'svg',
  'math',
  'script',
  'style',
  'textarea',
  'title',
  'select',
  'option',
  'optgroup',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'colgroup',
  'ul',
  'ol',
  'dl',
  'picture',
  'audio',
  'video',
  'pre',
  'code',
])

function tagName(node) {
  const name = node.openingElement.name
  return name.type === 'JSXIdentifier' ? name.name : undefined
}

function jsxTextValue(value) {
  const lines = value.split(/\r\n|\n|\r/)
  let lastNonEmptyLine = 0
  for (let index = 0; index < lines.length; index++) {
    if (/[^ \t]/.test(lines[index])) lastNonEmptyLine = index
  }
  return lines.reduce((result, line, index) => {
    let text = line.replace(/\t/g, ' ')
    if (index !== 0) text = text.replace(/^ +/, '')
    if (index !== lines.length - 1) text = text.replace(/ +$/, '')
    if (!text) return result
    return result + text + (index !== lastNonEmptyLine ? ' ' : '')
  }, '')
}

function isString(node) {
  return (
    (node.type === 'Literal' && typeof node.value === 'string') || node.type === 'TemplateLiteral'
  )
}

function isStableText(node) {
  if (isString(node)) return true
  return (
    node.type === 'ConditionalExpression' &&
    isStableText(node.consequent) &&
    isStableText(node.alternate)
  )
}

function stringLeaves(node) {
  if (isString(node)) return [node]
  if (node.type === 'LogicalExpression' && node.operator === '&&') {
    return stringLeaves(node.right)
  }
  if (node.type === 'ConditionalExpression') {
    return [...stringLeaves(node.consequent), ...stringLeaves(node.alternate)]
  }
  return []
}

function hasUnknownBranch(node) {
  if (isString(node)) return false
  if (node.type === 'Literal' && (node.value === null || typeof node.value === 'boolean')) {
    return false
  }
  if (node.type === 'LogicalExpression' && node.operator === '&&') {
    return hasUnknownBranch(node.right)
  }
  if (node.type === 'ConditionalExpression') {
    return hasUnknownBranch(node.consequent) || hasUnknownBranch(node.alternate)
  }
  return true
}

function hasChildContract(node) {
  const name = node.openingElement.name
  return (
    name.type === 'JSXNamespacedName' ||
    (name.type === 'JSXMemberExpression' && name.property.name === 'Slot') ||
    (name.type === 'JSXIdentifier' && /(^Slot$|Slot$)/.test(name.name)) ||
    node.openingElement.attributes.some(
      (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'asChild'
    )
  )
}

function isPassedToCall(node) {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (
      ancestor.type === 'FunctionDeclaration' ||
      ancestor.type === 'FunctionExpression' ||
      ancestor.type === 'ArrowFunctionExpression'
    ) {
      return false
    }
    if (
      (ancestor.type === 'CallExpression' || ancestor.type === 'NewExpression') &&
      ancestor.arguments.some((argument) => {
        for (let current = node; current && current !== ancestor; current = current.parent) {
          if (current === argument) return true
        }
        return false
      })
    ) {
      return true
    }
  }
  return false
}

function textContext(node) {
  let parent
  let canFix = !isPassedToCall(node)
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
    if (
      ancestor.type === 'JSXExpressionContainer' &&
      ancestor.expression.type === 'ConditionalExpression' &&
      hasUnknownBranch(ancestor.expression)
    ) {
      canFix = false
    }
    if (ancestor.type !== 'JSXElement') continue
    if (RESTRICTED_ANCESTORS.has(tagName(ancestor)) || hasChildContract(ancestor)) return null
    parent ??= ancestor
    canFix &&=
      TEXT_CONTAINERS.has(tagName(ancestor)) && ancestor.openingElement.attributes.length === 0
  }
  return parent && { parent, canFix }
}

function isProtected(node, parent) {
  if (tagName(parent) !== 'span') return false
  const children = parent.children.filter(
    (child) =>
      !(child.type === 'JSXText' && !jsxTextValue(child.value)) &&
      !(child.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression')
  )
  if (children.length !== 1 || children[0] !== node) return false
  return node.type === 'JSXText' || isStableText(node.expression)
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Isolate known JSX text in spans to reduce translation DOM mutation failures',
    },
    fixable: 'code',
    schema: [],
    messages: {
      wrap: 'Wrap this text in a dedicated span to reduce failures when browser translation changes text nodes.',
      review:
        'Review this text for a dedicated span; automatic wrapping may change its child contract or layout.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode

    function report(node, expression) {
      const textParent = textContext(node)
      if (!textParent || isProtected(node, textParent.parent)) return
      const canFix = textParent.canFix && (!expression || !hasUnknownBranch(expression))
      const leaves = expression ? stringLeaves(expression) : [node]
      for (const leaf of leaves) {
        if (
          (leaf.type === 'Literal' && leaf.value === '') ||
          (leaf.type === 'TemplateLiteral' &&
            leaf.expressions.length === 0 &&
            leaf.quasis[0].value.cooked === '')
        ) {
          continue
        }
        context.report({
          node: leaf,
          messageId: canFix ? 'wrap' : 'review',
          ...(canFix && {
            fix(fixer) {
              const text = sourceCode.getText(leaf)
              return fixer.replaceText(
                leaf,
                leaf.type === 'JSXText' ? `<span>${text}</span>` : `<span>{${text}}</span>`
              )
            },
          }),
        })
      }
    }

    return {
      JSXText(node) {
        if (jsxTextValue(node.value).trim()) report(node)
      },
      JSXExpressionContainer(node) {
        if (node.parent.type === 'JSXAttribute') return
        report(node, node.expression)
      },
    }
  },
}
