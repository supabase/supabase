const glob = require('glob')

const configFiles = glob.sync(`tokens/config/**/*.json`)
const sourceFiles = glob.sync(`tokens/source/**/*.json`)
const themeFiles = glob.sync(`tokens/themes/**/*.json`)
const semanticFiles = glob.sync(`tokens/semantic/**/*.json`)

const { registerTransforms } = require('@tokens-studio/sd-transforms')
const StyleDictionary = require('style-dictionary')

const Color = require('color')

/**
 * uncomment tailwind types as they become available
 */
const supportedTokenTypeList = [
  // 'spacing',
  // 'sizing',
  // 'borderRadius',
  // 'borderWidth',
  'color',
  // 'opacity',
  // 'fontFamilies',
  // 'lineHeights',
  // 'letterSpacing',
  // 'paragraphSpacing',
  // 'fontWeights',
  // 'fontSizes',
  // 'textCase',
  // 'textDecoration',
]

registerTransforms(StyleDictionary)

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
 * Custom format that generates tailwind friendly colors so we can add <alpha-value>
 * in the config later
 * https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
StyleDictionary.registerTransform({
  name: 'color/rgb',
  type: 'value',
  matcher: (prop) => prop.type === 'color',
  transformer: (prop) => {
    const color = Color(prop.original.value).hsl()
    return color.string()
  },
})

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
          return `"${token.path.slice(0).join('-')}": {
  cssVariable: "var(--${token.name})",
  value: "${value}"
}`
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

function getStyleDictionaryConfig(
  sourceFiles,
  fileName,
  type,
  buildTailwindFiles = false,
  rootTheme = false
) {
  console.log(sourceFiles)

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
        // transformGroup: 'tokens-studio',
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/type/fontWeight',
          'ts/resolveMath',
          'ts/size/css/letterspacing',
          'ts/typography/css/shorthand',
          'ts/border/css/shorthand',
          'ts/shadow/css/shorthand',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'name/cti/kebab',
          'color/rgb',
        ],
        buildPath: 'build/css/',
        files: [
          {
            destination: `${type}/${fileName}.css`,
            format: 'css/variables',
            options: {
              selector: rootTheme ? ':root' : `.${fileName}`,
              outputReferences: true,
            },
            // filter: (token) =>
            //   [sourceFiles.slice(-1)[0], ...semanticFiles, ...sourceFiles].includes(token.filePath),
          },
          ...configTailwindFilesByType,
        ],
      },
    },
  }
}

function fileNameCleaner(fileName) {
  return fileName.split('/').pop().replace('.json', '')
}

/**
 * BUILD SOURCE FILES
 */

sourceFiles.map(function (filePath) {
  const fileName = fileNameCleaner(filePath)
  const SD = StyleDictionary.extend(
    getStyleDictionaryConfig([filePath], fileName, 'source', true, true)
  )
  SD.buildAllPlatforms()
})

/**
 * BUILD THEME FILE
 */

themeFiles.map(function (filePath, i) {
  const buildTailwindFiles = filePath.includes('root') // i === 0
  const fileName = fileNameCleaner(filePath)
  const rootTheme = filePath.includes('root')
  const SD = StyleDictionary.extend(
    getStyleDictionaryConfig(
      // determine whether to include the root theme properties with each theme
      rootTheme ? [filePath] : ['tokens/themes/root.json', filePath],
      rootTheme ? 'dark' : fileName,
      'themes',
      buildTailwindFiles,
      false
    )
  )
  SD.buildAllPlatforms()
})

function convertToVariableIfNeeded(value) {
  if (value.startsWith('{') && value.endsWith('}')) {
    return `var(--${value.slice(1, -1).split('.').join('-')})`
  }
  return value
}

/**
 * BUILD TYPOGRAPHY FILES
 */

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

function getTypographyConfig() {
  console.log('Building: typography')
  return {
    source: [...semanticFiles, ...sourceFiles],
    platforms: {
      css: {
        transforms: ['name/cti/kebab'],
        transformGroup: 'tokens-studio',
        buildPath: 'build/css/',
        files: [
          {
            destination: `source/typography-classes.css`,
            format: 'css/typographyClasses',
            selector: ':root',
            filter: (token) => token.type === 'typography',
          },
        ],
      },
    },
  }
}

const typographyBuild = StyleDictionary.extend(getTypographyConfig())
typographyBuild.buildAllPlatforms()
