const glob = require('glob')
const StyleDictionary = require('style-dictionary')
const baseFiles = glob.sync(`styles/tokens/01_base/**/*.json`)
const themeFiles = glob.sync(`styles/tokens/02_themes/**/*.json`)
const semanticFiles = glob.sync(`styles/tokens/03_semantic/**/*.json`)
const componentFiles = glob.sync('styles/tokens/04_component/**/*.json')
const { Parser } = require('expr-eval')
const { parseToRgba } = require('color2k')
const fs = require('fs')

const basePath = 'styles/'
const supportedTokenTypeList = [
  'spacing',
  'sizing',
  'borderRadius',
  'borderWidth',
  'color',
  'opacity',
  'fontFamilies',
  'lineHeights',
  'letterSpacing',
  'paragraphSpacing',
  'fontWeights',
  'fontSizes',
  'textCase',
  'textDecoration',
]

console.log('Build started...')
console.log('\n==============================================')

const fontWeightMap = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  extraleicht: 200,
  light: 300,
  leicht: 300,
  normal: 400,
  book: 400,
  regular: 400,
  buch: 400,
  medium: 500,
  kraeftig: 500,
  kräftig: 500,
  semibold: 600,
  demibold: 600,
  halbfett: 600,
  bold: 700,
  dreiviertelfett: 700,
  extrabold: 800,
  ultabold: 800,
  fett: 800,
  black: 900,
  heavy: 900,
  super: 900,
  extrafett: 900,
}

/**
 * Helper: Transforms math like Figma Tokens
 */
const parser = new Parser()

function checkAndEvaluateMath(expr) {
  try {
    parser.evaluate(expr)
    return +parser.evaluate(expr).toFixed(3)
  } catch (ex) {
    return expr
  }
}

/**
 * Helper: Transforms dimensions to px
 */
function transformDimension(value) {
  if (value.endsWith('px')) {
    return value
  }
  return value + 'px'
}

/**
 * Helper: Transforms letter spacing % to em
 */
function transformLetterSpacing(value) {
  if (value.endsWith('%')) {
    const percentValue = value.slice(0, -1)
    return `${percentValue / 100}em`
  }
  return value
}

/**
 * Helper: Transforms letter spacing % to em
 */
function transformFontWeights(value) {
  const mapped = fontWeightMap[value.toLowerCase()]
  return `${mapped}`
}

/**
 * Helper: Transforms hex rgba colors used in figma tokens: rgba(#ffffff, 0.5) =? rgba(255, 255, 255, 0.5). This is kind of like an alpha() function.
 */
function transformHEXRGBa(value) {
  if (value.startsWith('rgba(#')) {
    const [hex, alpha] = value.replace(')', '').split('rgba(').pop().split(', ')
    const [r, g, b] = parseToRgba(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } else {
    return value
  }
}

/**
 * Helper: Transforms boxShadow object to shadow shorthand
 * This currently works fine if every value uses an alias, but if any one of these use a raw value, it will not be transformed.
 */
function transformShadow(shadow) {
  const { x, y, blur, spread, color } = shadow
  return `${x} ${y} ${blur} ${spread} ${color}`
}

/**
 * Helper: Transforms typography object to typography shorthand
 * This currently works fine if every value uses an alias, but if any one of these use a raw value, it will not be transformed.
 * If you'd like to output all typography values, you'd rather need to return the typography properties itself
 */
function transformTypography(value) {
  const { fontWeight, fontSize, lineHeight, fontFamily } = value
  return `${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}`
}

/**
 * Transform typography shorthands for css variables
 */
StyleDictionary.registerTransform({
  name: 'typography/shorthand',
  type: 'value',
  transitive: true,
  matcher: (token) => token.type === 'typography',
  transformer: (token) => transformTypography(token.original.value),
})

/**
 * Transform shadow shorthands for css variables
 */
StyleDictionary.registerTransform({
  name: 'shadow/shorthand',
  type: 'value',
  transitive: true,
  matcher: (token) => ['boxShadow'].includes(token.type),
  transformer: (token) => {
    return Array.isArray(token.original.value)
      ? token.original.value.map((single) => transformShadow(single)).join(', ')
      : transformShadow(token.original.value)
  },
})

/**
 * Transform fontSizes to px
 */
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  transitive: true,
  matcher: (token) => ['fontSizes', 'dimension', 'borderRadius', 'spacing'].includes(token.type),
  transformer: (token) => transformDimension(token.value),
})

/**
 * Transform letterSpacing to em
 */
StyleDictionary.registerTransform({
  name: 'size/letterspacing',
  type: 'value',
  transitive: true,
  matcher: (token) => token.type === 'letterSpacing',
  transformer: (token) => transformLetterSpacing(token.value),
})

/**
 * Transform fontWeights to numerical
 */
StyleDictionary.registerTransform({
  name: 'type/fontWeight',
  type: 'value',
  transitive: true,
  matcher: (token) => token.type === 'fontWeights',
  transformer: (token) => transformFontWeights(token.value),
})

/**
 * Transform rgba colors to usable rgba
 */
StyleDictionary.registerTransform({
  name: 'color/hexrgba',
  type: 'value',
  transitive: true,
  matcher: (token) => typeof token.value === 'string' && token.value.startsWith('rgba(#'),
  transformer: (token) => transformHEXRGBa(token.value),
})

/**
 * Transform to resolve math across all tokens
 */
StyleDictionary.registerTransform({
  name: 'resolveMath',
  type: 'value',
  transitive: true,
  matcher: (token) => token,
  // Putting this in strings seems to be required
  transformer: (token) => `${checkAndEvaluateMath(token.value)}`,
})

/**
 * Format for css variables
 */
StyleDictionary.registerFormat({
  name: 'css/variables',
  formatter: function (dictionary, config) {
    return `${this.selector} {
${dictionary.allProperties.map((prop) => `  --${prop.name}: ${prop.value};`).join('\n')}
}`
  },
})

function convertToVariableIfNeeded(value) {
  if (value.startsWith('{') && value.endsWith('}')) {
    return `var(--${value.slice(1, -1).split('.').join('-')})`
  }
  return value
}

function mapPropertyToCSSOutput(key, inputValue) {
  let value = convertCompositionValue(key, inputValue)
  switch (key) {
    case 'paddingTop':
      return `padding-top: ${value};`
    case 'paddingRight':
      return `padding-right: ${value};`
    case 'paddingBottom':
      return `padding-bottom: ${value};`
    case 'paddingLeft':
      return `padding-left: ${value};`
    case 'spacing':
      return `padding: ${value};`
    case 'itemSpacing':
      return `gap: ${value};`
    case 'horizontalPadding':
      return `padding-left: ${value};\n  padding-right: ${value};`
    case 'verticalPadding':
      return `padding-top: ${value};\n  padding-bottom: ${value};`
    case 'fontSize':
      return `font-size: ${value};`
    case 'lineHeight':
      return `line-height: ${value};`
    case 'fontWeight':
      return `font-weight: ${value};`
    case 'fontFamily':
      return `font-family: ${value};`
    case 'letterSpacing':
      return `letter-spacing: ${value};`
    case 'boxShadow':
      return `box-shadow: ${value};`
    case 'typography':
      return `font: ${value};`
    case 'fill':
      return `background-color: ${value};`
    case 'border':
      return `border-color: ${value};`
    case 'borderRadius':
      return `border-radius: ${value};`
    case 'borderRadiusTopLeft':
      return `border-top-left-radius: ${value};`
    case 'borderRadiusTopRight':
      return `border-top-right-radius: ${value};`
    case 'borderRadiusBottomRight':
      return `border-bottom-right-radius: ${value};`
    case 'borderRadiusBottomLeft':
      return `border-bottom-left-radius: ${value};`
    case 'borderWidth':
      return `border-width: ${value};`
    case 'borderWidthTop':
      return `border-top-width: ${value};`
    case 'borderWidthRight':
      return `border-right-width: ${value};`
    case 'borderWidthBottom':
      return `border-bottom-width: ${value};`
    case 'borderWidthLeft':
      return `border-left-width: ${value};`
    // Note: For border style we'd also need to set a border-style property to work correctly, which will be part of an upcoming release.
    // For now I'd suggest to have that in your composition token JSON even though we can't use it in Figma just yet.
    // Or keep this following line which hard-codes it to solid.
    case 'borderStyle':
      return `border-style: solid;`
  }
}

function convertCompositionValue(key, value) {
  if (value.startsWith('{') && value.endsWith('}')) {
    console.log('converting comp value', value.slice(1, -1).split('.').join('-'))
    return `var(--${value.slice(1, -1).split('.').join('-')})`
  }
  // If we're not using an alias we need to transform values.
  // As composition tokens don't have a dedicated type defined for each value,
  // we can use the name of the property to determine what transformation needs to take place.
  // All used properties can be found here: https://github.com/six7/figma-tokens/blob/main/src/constants/Properties.ts
  // Each of these can only be of a specific type, so this can be safely done.
  switch (key) {
    case 'fontSize':
    case 'padding':
    case 'paddingTop':
    case 'paddingRight':
    case 'paddingBottom':
    case 'paddingLeft':
    case 'itemSpacing':
    case 'horizontalPadding':
    case 'verticalPadding':
    case 'width':
    case 'height':
    case 'sizing':
    case 'borderRadius':
    case 'borderRadiusTopLeft':
    case 'borderRadiusTopRight':
    case 'borderRadiusBottomRight':
    case 'borderRadiusBottomLeft':
    case 'borderWidth':
    case 'borderWidthTop':
    case 'borderWidthRight':
    case 'borderWidthBottom':
    case 'borderWidthLeft':
      return transformDimension(value)
    case 'letterSpacing':
      return transformLetterSpacing(value)
    case 'fontWeight':
      return transformFontWeights(value)
    case 'color':
    case 'border':
      return transformHEXRGBa(value)
    case 'boxShadow':
      return transformShadow(value)
    case 'typography':
      return transformTypography(value)
    default:
      return value
  }
}

/**
 * Format for css typography classes
 * This generates theme-independent css classes so we're fine with just using css variables here
 */
StyleDictionary.registerFormat({
  name: 'css/typographyClasses',
  formatter: (dictionary, config) =>
    dictionary.allProperties
      .map((prop) => {
        return `
.${prop.name} {
  font: var(--${prop.name});
  letter-spacing: ${convertToVariableIfNeeded(prop.original.value.letterSpacing)};
  text-transform: ${convertToVariableIfNeeded(prop.original.value.textCase)};
  text-decoration: ${convertToVariableIfNeeded(prop.original.value.textDecoration)};
}`
      })
      .join('\n'),
})

/**
 * Format for css compisition classes
 * This generates theme-independent css classes so we're fine with just using css variables here
 */
StyleDictionary.registerFormat({
  name: 'css/compositionClasses',
  formatter: (dictionary, config) =>
    dictionary.allProperties.map(
      (prop) => `
.${prop.name} {
  ${Object.entries(prop.original.value)
    .map((property) => {
      const [key, value] = property
      return mapPropertyToCSSOutput(key, value)
    })
    .join('\n  ')}
}`
    ),
})

function getTypographyConfig() {
  console.log('Building: typography')
  return {
    source: ['styles/tokens/01_base/**/*.+(json)', 'styles/tokens/03_semantic/typography.json'],
    platforms: {
      css: {
        transforms: [
          'resolveMath',
          'size/px',
          'type/fontWeight',
          'size/letterspacing',
          'name/cti/kebab',
        ],
        buildPath: basePath,
        files: [
          {
            destination: `base/typography-classes.css`,
            format: 'css/typographyClasses',
            selector: ':root',
            filter: (token) => token.type === 'typography',
          },
        ],
      },
    },
  }
}

function getCompositionConfig() {
  return {
    source: [
      'tokens/01_base/**/*.+(json)',
      'tokens/02_themes/**/*.+(json)',
      'tokens/03_semantic/**/*.+(json)',
      'tokens/04_components/button.json',
    ],
    platforms: {
      css: {
        transforms: [
          'resolveMath',
          'size/px',
          'type/fontWeight',
          'size/letterspacing',
          'name/cti/kebab',
        ],
        buildPath: basePath,
        files: [
          {
            destination: `base/compositions.css`,
            format: 'css/compositionClasses',
            selector: ':root',
            filter: (token) => token.type === 'composition',
          },
        ],
      },
    },
  }
}

const formatTailwindValue = (tokenType, value) => {
  let formattedValue
  switch (tokenType) {
    case 'color':
    default:
      formattedValue = value
  }
  return formattedValue
}

/**
 * Custom format that generate tailwind color config based on css variables
 */
StyleDictionary.registerFormat({
  name: 'tw/css-variables',
  formatter({ dictionary }) {
    // console.log('dictionary', dictionary)
    return (
      'module.exports = ' +
      `{\n${dictionary.allProperties
        .map((token) => {
          const value = formatTailwindValue(token.type, token.value)
          return `"${token.path.slice(0).join('-')}": "var(--${token.name}, ${value});"`
        })
        .join(',\n')}\n}`
    )
  },
})

/**
 * Returns the files configuration
 * for generating separated tailwind files.
 */
function getConfigTailwindFilesByType(typeList) {
  console.log('\n')
  console.log('tailwind typeList', typeList)
  return typeList.map((typeName) => {
    return {
      destination: `tw-extend/${typeName}.js`,
      format: 'tw/css-variables',
      filter: {
        type: typeName,
      },
    }
  })
}

function getStyleDictionaryConfig(themePath, type, buildTailwindFiles = false, rootTheme = false) {
  console.log('\n')
  console.log('---')
  console.log('\n')
  console.log('Building: ', themePath, `type: ${type}`)
  const fileName = themePath.split('/').pop().replace('.json', '')
  const sourceFiles =
    type === 'base'
      ? ['styles/tokens/01_base/**/*.+(json)']
      : type === 'semantic'
      ? ['styles/tokens/01_base/**/*.+(json)', themePath]
      : [
          // 'styles/tokens/01_base/**/*.+(json)',
          themePath,
          // 'styles/tokens/03_semantic/**/*.+(json)',
          // ...semanticFiles,
          // 'styles/tokens/04_component/**/*.+(json)',
        ]

  let configTailwindFilesByType = []

  if (buildTailwindFiles) {
    console.log(`\n`)
    console.log(`Generating Tailwind Props ✨`)
    configTailwindFilesByType = getConfigTailwindFilesByType(supportedTokenTypeList)
  }

  return {
    source: sourceFiles,
    platforms: {
      css: {
        transforms: [
          'resolveMath',
          'size/px',
          'size/letterspacing',
          'type/fontWeight',
          'color/hexrgba',
          'typography/shorthand',
          'shadow/shorthand',
          'name/cti/kebab',
        ],
        buildPath: basePath,
        files: [
          {
            destination: `${type}/${fileName}.css`,
            format: 'css/variables',
            selector:
              type === 'base' || type === 'semantic' || rootTheme ? ':root' : `.${fileName}`,
            filter: (token) =>
              [themePath, ...semanticFiles, ...componentFiles].includes(token.filePath),
          },
          ...configTailwindFilesByType,
        ],
      },
    },
  }
}

baseFiles.map(function (file) {
  const SD = StyleDictionary.extend(getStyleDictionaryConfig(file, 'base', false))
  SD.buildAllPlatforms()
})

semanticFiles.map(function (file) {
  const SD = StyleDictionary.extend(getStyleDictionaryConfig(file, 'semantic', false))
  SD.buildAllPlatforms()
})

themeFiles.map(function (file, i) {
  const buildTailwindFiles = i === 0
  const rootTheme = file.includes('light')
  const SD = StyleDictionary.extend(
    getStyleDictionaryConfig(file, 'themes', buildTailwindFiles, rootTheme)
  )
  SD.buildAllPlatforms()
})

let typographyBuild = StyleDictionary.extend(getTypographyConfig())

typographyBuild.buildAllPlatforms()

const compositionBuild = StyleDictionary.extend(getCompositionConfig())

compositionBuild.buildAllPlatforms()

console.log('\n==============================================')
console.log('\nBuild completed!')
