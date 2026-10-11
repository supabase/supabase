import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { faviconTargets } from './favicon-targets.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sharp = createRequire(path.join(root, 'apps/kb/package.json'))('sharp')

for (const [variant, directory] of faviconTargets) {
  const file = (name) => path.join(root, directory, name)
  const svg = await readFile(path.join(root, `assets/favicons/${variant}.svg`), 'utf8')
  assert.match(svg, /width="512" height="512"/)
  assert.match(svg, /M0 153\.6C0 99\.835/)
  if (variant === 'local') {
    assert.doesNotMatch(svg, /stroke-dasharray|stroke-width/)
    assert.match(svg, /<path opacity="0.3"/)
  }
  const ico = await readFile(file('favicon.ico'))
  assert.equal(ico.readUInt16LE(0), 0)
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 3)
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16
    assert.equal(ico[entry], size)
    assert.equal(ico[entry + 1], size)
    assert.equal(ico.readUInt16LE(entry + 6), 32)
    const offset = ico.readUInt32LE(entry + 12)
    const length = ico.readUInt32LE(entry + 8)
    assert.ok(offset + length <= ico.length)
    const metadata = await sharp(ico.subarray(offset, offset + length)).metadata()
    assert.equal(metadata.width, size)
    assert.equal(metadata.height, size)
  }
  for (const size of [180, 192, 512]) {
    const name = size === 180 ? 'apple-icon-180x180.png' : `android-icon-${size}x${size}.png`
    const metadata = await sharp(file(name)).metadata()
    assert.equal(metadata.width, size)
    assert.equal(metadata.height, size)
    const stats = await sharp(file(name)).stats()
    assert.equal(stats.isOpaque, size === 180)
  }
  const manifest = JSON.parse(await readFile(file('manifest.json'), 'utf8'))
  assert.equal(manifest.icons.length, 2)
  for (const [index, size] of [192, 512].entries()) {
    const icon = manifest.icons[index]
    assert.equal(icon.sizes, `${size}x${size}`)
    assert.equal(icon.purpose, 'any')
    for (const base of ['', '/docs', '/kb', '/design-system', '/custom/base']) {
      const url = new URL(icon.src, `https://example.com${base}/favicon/manifest.json`)
      assert.equal(url.pathname, `${base}/favicon/android-icon-${size}x${size}.png`)
    }
    assert.ok((await readFile(file(icon.src))).length > 0)
  }
}

console.log(`Validated ${faviconTargets.length} icon sets, ICO entries and manifest base paths.`)
