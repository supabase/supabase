import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const [projectRef, file, origin = 'https://supabase.com/dashboard'] = process.argv.slice(2)
if (!projectRef || !file || !/^[a-zA-Z0-9_-]+$/.test(projectRef)) {
  throw new Error(
    'Usage: node apps/studio/scripts/model/encode.mjs <project-ref> <model.json> [origin]'
  )
}
const json = readFileSync(file, 'utf8')
JSON.parse(json)
if (Buffer.byteLength(json, 'utf8') > 65_536)
  throw new Error('Model exceeds 65,536 decompressed bytes')
const encoded = gzipSync(json).toString('base64url')
if (encoded.length > 16_384) throw new Error('Model exceeds 16,384 encoded characters')
const base = new URL(origin)
if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Origin must use HTTP or HTTPS')
console.log(`${base.href.replace(/\/$/, '')}/project/${projectRef}/model#v1=${encoded}`)
