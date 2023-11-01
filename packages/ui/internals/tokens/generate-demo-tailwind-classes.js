const fs = require('fs')

const color = require('./../../build/css/tw-extend/color')

/**
 *
 * Generates a JS file with all the custom tailwind color classes
 *
 * @param {string} file
 * Name of file to be created
 */
function writeJsFile(file) {
  const backgrounds = Object.keys(color).filter((x) => x.includes('background-'))
  const borders = Object.keys(color).filter((x) => x.includes('border-'))
  const texts = Object.keys(color).filter((x) => x.includes('foreground-'))
  const colors = Object.keys(color).filter(
    (x) =>
      !x.includes('foreground-') &&
      !x.includes('background-') &&
      !x.includes('border-') &&
      !x.includes('colors-') &&
      !x.includes('variables-')
  )
  const palletes = Object.keys(color).filter((x) => x.includes('colors-'))

  // console.log('Example tailwind classes: ')

  function santizieDefaults(x) {
    // console.log(x)
    let value = x
    value = value.replace('-DEFAULT', '')
    value = value.replace('background', 'bg')
    value = value.replace('foreground', 'text')
    value = value.replace('colors-', 'bg-')
    value = value.toLowerCase()
    return value
  }

  const result = {
    background: [...backgrounds.map((x) => santizieDefaults(x))],
    border: [...borders.map((x) => santizieDefaults(x))],
    text: [...texts.map((x) => santizieDefaults(x))],
    colors: [...colors.map((x) => `bg-${santizieDefaults(x)}`)],
    palletes: [...palletes.map((x) => santizieDefaults(x))],
  }

  const fileContent = `export default ${JSON.stringify(result, null, 2)};\n`

  fs.writeFileSync(file, fileContent)

  console.log('saved example color classes to : ', file)
}

writeJsFile('./src/lib/tailwind-demo-classes.ts')

// example output
// ./src/lib/tailwind-demo-classes.js

// module.exports = {
//   "background": [
//     "bg",
//     "bg-selection",
//     //..
//   ],
//   "border": [
//     "border",
//     "border-muted",
//     //..
//   ],
//   "text": [
//     "text",
//     "text-strong",
//     //..
//   ],
//   "colors": [
//     "bg-destructive-200",
//     "bg-destructive-300",
//     //..
//   ],
//   "palletes": [
//     "bg-black",
//     "bg-white",
//     //..
//   ]
// }
