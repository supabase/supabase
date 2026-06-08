import { globby } from 'globby'
import { create as createTar } from 'tar'

async function generate() {
  // Create a tar.gz archive of the generated docs, served at /docs/docs.tar.gz.
  // Sorted entries, portable headers, and a fixed mtime keep the output deterministic.
  const archivePath = 'public/docs.tar.gz'
  const entries = (await globby(['**'], { cwd: 'public/docs' })).sort()
  await createTar(
    { gzip: true, file: archivePath, cwd: 'public/docs', portable: true, mtime: new Date() },
    entries
  )
  console.log(`Created archive at ${archivePath}`)
}

generate()
