import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

export const LOCKFILE_PATH = path.join(process.cwd(), 'pnpm-lock.yaml')

export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

/**
 * Reinstalls from the current lockfile so node_modules matches it again after a revert.
 * Without this, the next `pnpm <script>` call runs its own install first and prints it to stdout.
 */
export function syncNodeModules(): void {
  try {
    execSync('pnpm install --frozen-lockfile --silent', { stdio: 'pipe', encoding: 'utf-8' })
  } catch (error: any) {
    console.error(
      `WARNING: could not reinstall from the reverted lockfile: ${error.message ?? error}`
    )
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Every version of the package in the lockfile, sorted from lowest to highest. */
export function findVersionsInLockfile(packageName: string): string[] {
  const lockfileContent = fs.readFileSync(LOCKFILE_PATH, 'utf-8')
  const escaped = escapeRegex(packageName)
  // pnpm lockfile v9 format:
  //   scoped:   `  '@org/pkg@x.y.z':`
  //   unscoped: `  pkg@x.y.z:`
  const pattern = packageName.startsWith('@')
    ? new RegExp(`^  '${escaped}@(\\d+\\.\\d+\\.\\d+)':`, 'gm')
    : new RegExp(`^  ${escaped}@(\\d+\\.\\d+\\.\\d+):`, 'gm')

  const versions = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = pattern.exec(lockfileContent)) !== null) {
    versions.add(match[1])
  }

  return [...versions].sort(compareSemver)
}

function handleMinimumReleaseAgeError(output: string): void {
  const blocks = output.split('ERR_PNPM_NO_MATCHING_VERSION')
  for (const block of blocks.slice(1)) {
    const versionMatch = block.match(
      /No matching version found for (\S+) published by .+?\. Version (\S+) satisfies the specs but was released at (.+)/
    )
    const chainLines = block
      .split('\n')
      .filter((line: string) => /^\s+at /.test(line))
      .map((line: string) => line.trim().replace(/^at /, ''))

    if (versionMatch) {
      const [, spec, version, releaseDate] = versionMatch
      console.error(`\n  Blocked package: ${spec} (v${version} released ${releaseDate.trim()})`)
      if (chainLines.length > 0) {
        console.error(`  Dependency chain: ${chainLines.join(' -> ')}`)
      }
      const pkgName = spec.replace(/@[^/]*$/, '')
      console.error(
        `  To unblock, add "${pkgName}" to the minimumReleaseAgeExclude setting in pnpm-workspace.yaml`
      )
    }
  }
}

export interface BumpResult {
  previousVersions: string[]
  finalVersions: string[]
  /** Versions still in the lockfile that are lower than the target version, if one was given. */
  belowTarget: string[]
}

/**
 * Updates every copy of a package in the lockfile to the newest version that its dependents'
 * ranges (and any overrides in pnpm-workspace.yaml) allow, with
 * `pnpm update <pkg> --recursive --no-save`. It changes pnpm-lock.yaml only.
 *
 * A version outside a dependent's range can't be reached this way: that needs the dependent to
 * be updated, or a permanent override. Pass `targetVersion` (e.g. `^1.2.3` or `1.2.3`) to get
 * the copies that are still below it in `belowTarget`. The caller decides whether to keep the
 * result or revert the lockfile.
 */
export async function bumpPackage(
  packageName: string,
  targetVersion?: string
): Promise<BumpResult> {
  const previousVersions = findVersionsInLockfile(packageName)
  if (previousVersions.length === 0) {
    throw new Error(`Package "${packageName}" not found in pnpm-lock.yaml`)
  }

  console.log(`Package: ${packageName}`)
  console.log(`Versions in lockfile: ${previousVersions.join(', ')}`)
  if (targetVersion) console.log(`Target version: ${targetVersion}`)

  console.log(`\nRunning pnpm update ${packageName} --recursive --no-save...`)
  try {
    execSync(`pnpm update ${packageName} --recursive --no-save`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
  } catch (error: any) {
    const output = (error.stdout ?? '') + (error.stderr ?? '')
    if (output.includes('ERR_PNPM_NO_MATCHING_VERSION')) {
      console.error(
        `\nNo matching version found for "${packageName}" — blocked by minimumReleaseAge.`
      )
      handleMinimumReleaseAgeError(output)
      throw new Error(`Blocked by minimumReleaseAge`)
    }
    throw new Error(output.trim() || String(error.message ?? error))
  }

  const finalVersions = findVersionsInLockfile(packageName)
  console.log(`Versions after update: ${finalVersions.join(', ')}`)

  const minimum = targetVersion?.replace(/^[\^~]/, '')
  const belowTarget = minimum ? finalVersions.filter((v) => compareSemver(v, minimum) < 0) : []

  return { previousVersions, finalVersions, belowTarget }
}

async function main(): Promise<void> {
  const [packageName, versionArg] = process.argv.slice(2)

  if (!packageName) {
    console.error('Usage: pnpm tsx scripts/bump-package.ts <package-name> [minimum-version]')
    process.exit(1)
  }

  const originalLockfile = fs.readFileSync(LOCKFILE_PATH, 'utf-8')
  const revert = () => {
    console.error('\nReverting pnpm-lock.yaml...')
    fs.writeFileSync(LOCKFILE_PATH, originalLockfile, 'utf-8')
    syncNodeModules()
  }

  let result: BumpResult
  try {
    result = await bumpPackage(packageName, versionArg)
  } catch (error: any) {
    console.error(error.message ?? error)
    revert()
    process.exit(1)
  }

  const { previousVersions, finalVersions, belowTarget } = result
  const unchanged = previousVersions.join() === finalVersions.join()

  if (unchanged || belowTarget.length > 0) {
    console.error(
      unchanged
        ? `\nERROR: "${packageName}" was not bumped: every copy is already the newest version its dependents allow.`
        : `\nERROR: "${packageName}" still has versions below ${versionArg}: ${belowTarget.join(', ')}.`
    )
    console.error('Update the dependent package, or add a scoped override in pnpm-workspace.yaml.')
    revert()
    process.exit(1)
  }

  console.log(
    `\nSUCCESS: ${packageName} bumped from ${previousVersions.join(', ')} to ${finalVersions.join(', ')}.`
  )
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
