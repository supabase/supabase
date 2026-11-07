#!/usr/bin/env node
// Cross-platform entry point for the CDN asset upload that runs after
// `next build`. The upload itself lives in the repo-level
// scripts/upload-static-assets.sh; this wrapper only decides whether to call
// it. Keeping that decision in Node means `pnpm build` works where package
// scripts run through cmd.exe (Windows), which can't parse a POSIX `if [ ... ]`
// or execute a .sh file. Local builds never need bash, because the upload only
// happens on production or forced builds.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SKIP_MESSAGE =
  'Skipping asset upload. Set FORCE_ASSET_CDN=1 or VERCEL_ENV=production to execute.'

/**
 * Whether the asset upload should run. Mirrors the checks at the top of
 * scripts/upload-static-assets.sh (keep the two in sync), plus
 * `SKIP_ASSET_UPLOAD=1`, which used to be checked inline in `build:next`.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {boolean}
 */
export function shouldUploadStaticAssets(env) {
  if (env.SKIP_ASSET_UPLOAD === '1') return false
  if (env.FORCE_ASSET_CDN === '-1') return false
  return env.FORCE_ASSET_CDN === '1' || env.VERCEL_ENV === 'production'
}

function main() {
  if (!shouldUploadStaticAssets(process.env)) {
    console.log(SKIP_MESSAGE)
    return 0
  }

  const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
  const uploadScript = path.resolve(scriptsDir, '../../../scripts/upload-static-assets.sh')
  const result = spawnSync('bash', [uploadScript], { stdio: 'inherit', env: process.env })
  if (result.error) {
    console.error('upload-static-assets: failed to run bash:', result.error.message)
    return 1
  }
  return result.status ?? 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main())
}
