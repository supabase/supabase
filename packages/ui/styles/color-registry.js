const colorTokenGroups = {
  colors: [
    'colors-black',
    'colors-white',
  ],
  variables: ['variables-colors-brand-primary', 'variables-colors-brand-accent'],
  foreground: [
    'foreground-DEFAULT',
    'foreground-light',
    'foreground-lighter',
    'foreground-muted',
    'foreground-contrast',
  ],
  background: [
    'background-200',
    'background-DEFAULT',
    'background-alternative-200',
    'background-alternative-DEFAULT',
    'background-selection',
    'background-control',
    'background-surface-75',
    'background-surface-100',
    'background-surface-200',
    'background-surface-300',
    'background-surface-400',
    'background-overlay-DEFAULT',
    'background-overlay-hover',
    'background-muted',
    'background-button-DEFAULT',
    'background-dialog-DEFAULT',
    'background-dash-sidebar',
    'background-dash-canvas',
  ],
  border: [
    'border-DEFAULT',
    'border-muted',
    'border-secondary',
    'border-overlay',
    'border-control',
    'border-alternative',
    'border-strong',
    'border-stronger',
    'border-button-DEFAULT',
    'border-button-hover',
  ],
  destructive: [
    'destructive-200',
    'destructive-300',
    'destructive-400',
    'destructive-500',
    'destructive-600',
    'destructive-DEFAULT',
  ],
  warning: [
    'warning-200',
    'warning-300',
    'warning-400',
    'warning-500',
    'warning-600',
    'warning-DEFAULT',
  ],
  brand: ['brand-200', 'brand-300', 'brand-400', 'brand-500', 'brand-600', 'brand-DEFAULT', 'brand-link'],
  _secondary: ['_secondary-200', '_secondary-400', '_secondary-DEFAULT'],
  code_block: ['code_block-1', 'code_block-2', 'code_block-3', 'code_block-4', 'code_block-5'],
}

const allColorTokens = Object.values(colorTokenGroups).flat()

function getCssVariableName(token) {
  return token
    .replace(/^_/, '')
    .replace(/code_block/g, 'code-block')
    .replace(/DEFAULT/g, 'default')
}

function getTailwindColorValue(token) {
  const cssVariableName = getCssVariableName(token)

  if (token.includes('-alpha-')) {
    return `var(--${cssVariableName})`
  }

  return `hsl(var(--${cssVariableName}) / <alpha-value>)`
}

function kebabToNested(obj) {
  const result = {}

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split('-')
    let currentObj = result

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i] === 'DEFAULT' ? parts[i] : parts[i].toLowerCase()

      if (!currentObj[part]) {
        currentObj[part] = {}
      }

      if (i === parts.length - 1) {
        currentObj[part] = typeof value === 'object' ? kebabToNested(value) : value.toLowerCase()
      } else {
        currentObj = currentObj[part]
      }
    }
  }

  return result
}

function buildTailwindColorExtend(tokens = allColorTokens) {
  const tokenMap = {}

  tokens.forEach((token) => {
    tokenMap[token] = getTailwindColorValue(token)
  })

  return kebabToNested(tokenMap)
}

function buildTailwindCategoryColors(groupName) {
  const tokenMap = {}

  colorTokenGroups[groupName].forEach((token) => {
    const key = token.split('-').slice(1).join('-')

    tokenMap[key] = getTailwindColorValue(token)

    if (key === 'DEFAULT') {
      tokenMap.default = getTailwindColorValue(token)
    }
  })

  return kebabToNested(tokenMap)
}

module.exports = {
  allColorTokens,
  buildTailwindCategoryColors,
  buildTailwindColorExtend,
  colorTokenGroups,
  getCssVariableName,
  getTailwindColorValue,
  kebabToNested,
}
