#!/usr/bin/env node
/**
 * Cross-platform helper used by `build:next`.
 *
 * The previous package.json script used a bash `if [ "$SKIP_ASSET_UPLOAD" != "1" ]`
 * which is parsed by cmd.exe on Windows and fails immediately with:
 *   "$SKIP_ASSET_UPLOAD" was unexpected at this time.
 *
 * This Node script:
 * - Respects SKIP_ASSET_UPLOAD=1 (used by e2e and local self-hosted setups)
 * - Runs the existing bash upload script when appropriate
 * - On Windows without bash available, skips gracefully (the real upload only
 *   happens on Vercel production / when FORCE_ASSET_CDN=1 anyway)
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env.SKIP_ASSET_UPLOAD === '1') {
  console.log('Skipping asset upload (SKIP_ASSET_UPLOAD=1)')
  process.exit(0)
}

const studioScriptsDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(studioScriptsDir, '../../..')
const uploadScript = path.join(repoRoot, 'scripts', 'upload-static-assets.sh')

const result = spawnSync('bash', [uploadScript], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.resolve(studioScriptsDir, '..'), // apps/studio
})

if (result.error) {
  // Common on Windows when Git Bash / WSL bash is not on PATH.
  // Production uploads run on Vercel (Linux) so this is safe for local builds.
  if (process.platform === 'win32') {
    console.log(
      'Skipping asset upload on Windows (bash not available). ' +
        'Upload only runs on production deploys (VERCEL_ENV=production or FORCE_ASSET_CDN=1).'
    )
    process.exit(0)
  }
  console.error('Failed to run upload-static-assets.sh:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
