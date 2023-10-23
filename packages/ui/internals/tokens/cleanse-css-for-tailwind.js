const glob = require('glob')
const fs = require('fs')

const cssFiles = glob.sync('build/css/**/*.css')

function transformCssFiles(precision) {
  cssFiles.forEach((file) => {
    const css = fs.readFileSync(file, 'utf8')

    let transformedCss = css

    // transform hsl values to degrees, percentages
    transformedCss = transformedCss.replace(
      /hsl\(([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\)/g,
      (match, hue, saturation, lightness) => {
        hue = `${roundNumber(hue, precision)}deg`
        saturation = `${roundNumber(saturation, precision)}%`
        lightness = `${roundNumber(lightness, precision)}%`
        return `${hue} ${saturation} ${lightness}`
      }
    )

    // remove --core prefix from files
    transformedCss = transformedCss.replace(/--core-/g, '--')

    fs.writeFileSync(file, transformedCss)
  })

  function roundNumber(number, precision) {
    const rounded = parseFloat(number).toFixed(precision)
    const str = rounded.toString()
    const match = str.match(/^(\d+)\.(\d+)$/)
    if (match && match[2] === '0'.repeat(match[2].length)) {
      return match[1]
    }
    return rounded
  }
}

// Example usage:
transformCssFiles(1)
