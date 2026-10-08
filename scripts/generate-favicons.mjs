import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { faviconTargets } from './favicon-targets.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(path.join(root, 'apps/kb/package.json'))
const sharp = require('sharp')

// ICO directory entries contain individually rendered PNG images, never an upscaled bitmap.
function encodeIco(images) {
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16
    header[entry] = size
    header[entry + 1] = size
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(data.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map(({ data }) => data)])
}

for (const [variant, relativeDirectory] of faviconTargets) {
  const directory = path.join(root, relativeDirectory)
  await mkdir(directory, { recursive: true })
  const svg = await readFile(path.join(root, `assets/favicons/${variant}.svg`))
  const background = variant === 'staging' ? '#FFFFFF' : '#1C1C1C'
  const render = (size) => sharp(svg).resize(size, size)
  const images = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await render(size).png().toBuffer() }))
  )
  await writeFile(path.join(directory, 'favicon.ico'), encodeIco(images))
  await render(180)
    .flatten({ background })
    .png()
    .toFile(path.join(directory, 'apple-icon-180x180.png'))
  for (const size of [192, 512]) {
    await render(size)
      .png()
      .toFile(path.join(directory, `android-icon-${size}x${size}.png`))
  }
  const manifestPath = path.join(directory, 'manifest.json')
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    manifest = { name: 'Supabase Knowledge Base', short_name: 'Supabase' }
  }
  // Relative icon URLs resolve beside the manifest, including under /docs and /kb.
  manifest.icons = [192, 512].map((size) => ({
    src: `android-icon-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any',
  }))
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

// Next.js layouts declare their icons explicitly. Do not add app/favicon.ico,
// which would duplicate the shared icon declarations.
