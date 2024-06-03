import fs from 'fs'
import path from 'path'

// Path to the package within the global node_modules
const packagePath = path.resolve(process.cwd(), '../../node_modules/@contentlayer2')

// Path to the specific file you want to modify
const filePath = path.join(packagePath, 'core', 'dist', 'getConfig', 'index.js')

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`)
    return
  }

  // Modify the file content
  let modifiedContent = data.replace('../../../../', '../../../')

  // Write the modified content back to the file
  fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`)
      return
    }

    console.log('fix-contentlayer-bug was successfull')
  })
})
