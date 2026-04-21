import * as fs from 'fs'
import * as path from 'path'

function processJsonFile(filePath: string) {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8')
    const json = JSON.parse(content)

    // Convert to string to do replacement
    let stringified = JSON.stringify(json, null, 2)

    // Perform the replacement
    stringified = stringified
      .replace(/\/ui\/example\/password-based-auth/g, '')
      .replace(/\/example\/password-based-auth/g, '')
      .replaceAll(
        "import { Link } from '@/registry/default/components/ui/link'",
        "import Link from 'next/link'"
      )
      // Replace the file origin path to exclude the monorepo structure
      .replaceAll('node_modules/@supabase/vue-blocks/', '')

    // Write back to file
    fs.writeFileSync(filePath, stringified)
    console.log(`✓ Updated ${filePath}`)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
}

function processDirectory(directoryPath: string) {
  const files = fs.readdirSync(directoryPath)

  files.forEach((file) => {
    const fullPath = path.join(directoryPath, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      processDirectory(fullPath)
    } else if (path.extname(file) === '.json') {
      processJsonFile(fullPath)
    }
  })
}

// Start processing from the specified directory
const targetDir = path.join(process.cwd(), 'public/r')

if (!fs.existsSync(targetDir)) {
  console.error('Target directory does not exist:', targetDir)
  process.exit(1)
}

console.log('Starting JSON file processing...')
processDirectory(targetDir)
console.log('Processing complete!')
