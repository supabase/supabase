const glob = require('glob')

const sourceFiles = glob.sync(`tokens/core/**/*.json`)
const themeFiles = glob.sync(`tokens/themes/**/*.json`)

const StyleDictionary = require('style-dictionary')
const deepMerge = require('deepmerge')
const webConfig = require('./internals/transform/web/index.js')

const Color = require('color')

StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => {
    return (token.unit === 'pixel' || token.type === 'dimension') && token.value !== 0
  },
  transformer: (token) => {
    return `${token.value}px`
  },
})

StyleDictionary.registerTransform({
  name: 'size/percent',
  type: 'value',
  matcher: (token) => {
    return token.unit === 'percent' && token.value !== 0
  },
  transformer: (token) => {
    return `${token.value}%`
  },
})

StyleDictionary.registerFilter({
  name: 'validToken',
  matcher: function (token) {
    return [
      'dimension',
      'string',
      'number',
      'color',
      'custom-spacing',
      'custom-gradient',
      'custom-fontStyle',
      'custom-radius',
      'custom-shadow',
    ].includes(token.type)
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
            .replace('core-', '') // remove core prefix
            .replace('default', 'DEFAULT') // replace default with DEFAULT for tailwind config
        })
        .join(',\n')}\n}`
    )
  },
})

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
    if (!prop.original.value) {
      console.error(`No colorvalue detected for ${prop.name}.`)
    }

    if (prop.original.value === '#') {
      console.error(`Only "#" as value for ${prop.name}. Must use a correct format like "#FFF"`)
    }

    const color = Color(prop?.original?.value)

    if (!color) {
      console.error('No color')
    }

    // console.log(color)

    const hsl = Color(prop?.original?.value).hsl()
    return hsl.string()
  },
})

function fileNameCleaner(fileName) {
  return fileName.split('/').pop().replace('.json', '')
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

/**
 * BUILD SOURCE FILES
 */

console.log(`\n`)

console.log('Building Core Styles...')

console.log(`\n`)

sourceFiles.map(function (filePath) {
  console.log(filePath)

  const StyleDictionaryExtended = StyleDictionary.extend({
    ...deepMerge.all([webConfig]),
    source: [filePath],
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: 'build/css/',
        files: [
          {
            destination: 'source/global.css',
            format: 'css/variables',
            filter: 'validToken',
            options: {
              showFileHeader: false,
            },
          },
        ],
      },
      //   'json-flat': {
      //     transformGroup: 'js',
      //     buildPath: 'build/json/',
      //     files: [
      //       {
      //         destination: 'core-styles.json',
      //         format: 'json/flat',
      //         filter: 'validToken',
      //       },
      //     ],
      //   },
    },
  })

  StyleDictionaryExtended.buildAllPlatforms()
  //   console.log('StyleDictionaryExtended', StyleDictionaryExtended)
  // Check if properties and all are defined
  if (StyleDictionaryExtended.properties && StyleDictionaryExtended.properties.all) {
    // Modify and print the CSS with the prefix removed
    const modifiedCSS =
      StyleDictionaryExtended.properties.all.reduce((result, prop) => {
        const modifiedName = prop.path.join('-').replace(/^core-/, '')
        result += `  --${modifiedName}: ${prop.original.value};\n`
        return result
      }, ':root {\n') + '}'

    console.log(modifiedCSS)
  } else {
    console.error('Error: Unable to retrieve properties from StyleDictionaryExtended.')
  }
})

console.log(`\n`)

console.log(`Building Theme Styles...`)

console.log(`\n`)

themeFiles.map(function (filePath, i) {
  let fileName = fileNameCleaner(filePath)

  // rename concept-one to dark-new
  fileName = fileName === 'concept-one' ? 'deep-dark' : fileName

  let configTailwindFilesByType = []

  if (i === 0) {
    // runs on first theme file
    console.log(`\n`)
    console.log(`Generating Tailwind Props ✨`)
    configTailwindFilesByType = getConfigTailwindFilesByType(supportedTokenTypeList)
  }

  const StyleDictionaryExtended = StyleDictionary.extend({
    ...deepMerge.all([webConfig]),
    source: [...sourceFiles, filePath],
    platforms: {
      css: {
        transformGroup: 'custom/css',
        buildPath: 'build/css/',
        files: [
          {
            destination: `themes/${fileName}.css`,
            format: 'css/variables',
            filter: 'validToken',
            options: {
              showFileHeader: false,
              outputReferences: true,
              selector: `[data-theme='${fileName}'],
.${fileName}`,
            },
            filter: (token) => token.filePath === filePath,
          },
          ...configTailwindFilesByType,
        ],
      },
      //   'json-flat': {
      //     transformGroup: 'js',
      //     buildPath: 'build/json/',
      //     files: [
      //       {
      //         destination: `themes/${fileName}-styles.json`,
      //         format: 'json/flat',
      //         filter: 'validToken',
      //       },
      //     ],
      //   },
    },
  })
  StyleDictionaryExtended.buildAllPlatforms()
})
