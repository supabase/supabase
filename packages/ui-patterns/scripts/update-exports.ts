import * as fs from 'node:fs'
import * as path from 'node:path'

const SRC_DIR = path.resolve(__dirname, '..', 'src')

interface ExportMap {
  [key: string]: {
    import: string
    types: string
  }
}

function getAllSourceFiles(dir: string): ExportMap {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const exportsMap: ExportMap = {}

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      Object.assign(exportsMap, getAllSourceFiles(fullPath))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      const relativePath = path.relative(SRC_DIR, fullPath)
      const noExtension = relativePath.replace(/\.(ts|tsx)$/, '')
      const segments = noExtension.split(path.sep)

      // If filename is "index", remove it from the export path
      const isIndex = segments[segments.length - 1] === 'index'
      const exportSegments = isIndex ? segments.slice(0, -1) : segments

      const subpath = `./${exportSegments.join('/')}` // clean export
      const filePath = `./src/${relativePath.replace(/\\/g, '/')}`

      exportsMap[subpath] = {
        import: filePath,
        types: filePath,
      }
    }
  }

  return exportsMap
}

function updatePackageJson(exportsMap: ExportMap): void {
  const packageJsonPath = path.resolve(__dirname, '..', 'package.json')
  const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonRaw)

  packageJson.exports = {
    './package.json': './package.json',
    '.': {
      import: './index.tsx',
      types: './index.tsx',
    },
    ...exportsMap,
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('✅ package.json exports updated (with clean index paths).')
}

// Run the export generation
const exportsMap = getAllSourceFiles(SRC_DIR)
updatePackageJson(exportsMap)
