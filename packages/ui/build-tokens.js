const glob = require('glob')

const configFiles = glob.sync(`tokens/config/**/*.json`)
const sourceFiles = glob.sync(`tokens/source/**/*.json`)
const themeFiles = glob.sync(`tokens/themes/**/*.json`)
const semanticFiles = glob.sync(`tokens/semantic/**/*.json`)

const { registerTransforms } = require('@tokens-studio/sd-transforms')
const StyleDictionary = require('style-dictionary')

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

// old one

// registerTransforms(StyleDictionary)

// const sd = StyleDictionary.extend({
//   source: 'tokens/%themeTokenSets%',
//   platforms: {
//     css: {
//       transformGroup: 'tokens-studio',
//       prefix: 'sd',
//       buildPath: 'build/css/',
//       files: [
//         {
//           destination: '_variables-%theme%.css',
//           format: 'css/variables',
//         },
//       ],
//     },
//     js: {
//       transformGroup: 'tokens-studio',
//       buildPath: 'build/js/',
//       files: [
//         {
//           destination: 'variables-%theme%.js',
//           format: 'javascript/es6',
//         },
//       ],
//     },
//   },
// })

// sd.cleanAllPlatforms()
// sd.buildAllPlatforms()

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
        transformGroup: 'tokens-studio',
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

sourceFiles.map(function (filePath) {
  const fileName = fileNameCleaner(filePath)
  const SD = StyleDictionary.extend(
    getStyleDictionaryConfig([filePath], fileName, 'source', true, true)
  )
  SD.buildAllPlatforms()
})

// semanticFiles.map(function (file) {
//   const SD = StyleDictionary.extend(getStyleDictionaryConfig(file, 'semantic', false))
//   SD.buildAllPlatforms()
// })

themeFiles.map(function (filePath, i) {
  const buildTailwindFiles = filePath.includes('root') // i === 0
  const fileName = fileNameCleaner(filePath)
  const rootTheme = filePath.includes('root')
  const SD = StyleDictionary.extend(
    getStyleDictionaryConfig(
      // determine wether to include the root theme properties with each theme
      rootTheme ? [filePath] : ['tokens/themes/root.json', filePath],
      rootTheme ? 'darkasdsd' : fileName,
      'themes',
      buildTailwindFiles,
      false
    )
  )
  SD.buildAllPlatforms()
})
