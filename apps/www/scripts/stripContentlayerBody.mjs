import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const blogpostDir = path.join(__dirname, '../.contentlayer/generated/BlogPost')

async function stripBodyFromBlogpostJsonFiles() {
  try {
    const stat = await fs.stat(blogpostDir).catch(() => null)
    if (!stat || !stat.isDirectory()) return

    const entries = await fs.readdir(blogpostDir)
    const jsonFiles = entries.filter((name) => name.endsWith('.json'))

    await Promise.all(
      jsonFiles.map(async (fileName) => {
        const fullPath = path.join(blogpostDir, fileName)
        try {
          const raw = await fs.readFile(fullPath, 'utf8')
          const data = JSON.parse(raw)
          if (data && typeof data === 'object' && 'body' in data) {
            delete data.body
            await fs.writeFile(fullPath, JSON.stringify(data), 'utf8')
          }
        } catch {
          // Skip files that cannot be processed
        }
      })
    )
  } catch {
    // Silently ignore to avoid failing the build if optional
  }
}

await stripBodyFromBlogpostJsonFiles()
