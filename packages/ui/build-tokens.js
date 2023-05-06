const { registerTransforms } = require('@tokens-studio/sd-transforms')
const StyleDictionary = require('style-dictionary')

registerTransforms(StyleDictionary)

const sd = StyleDictionary.extend({
  source: ['tokens/*.json'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      prefix: 'sd',
      buildPath: 'build/css/',
      files: [
        {
          destination: '_variables-%theme%.css',
          format: 'css/variables',
        },
      ],
    },
    js: {
      transformGroup: 'tokens-studio',
      buildPath: 'build/js/',
      files: [
        {
          destination: 'variables-%theme%.js',
          format: 'javascript/es6',
        },
      ],
    },
  },
})

sd.cleanAllPlatforms()
sd.buildAllPlatforms()
