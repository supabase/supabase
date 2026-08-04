import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

const WORKSPACE_YAML_PATH = path.join(process.cwd(), 'pnpm-workspace.yaml')
export const LOCKFILE_PATH = path.join(process.cwd(), 'pnpm-lock.yaml')

export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatOverrideLine(moduleName: string, version: string): string {
  const key = moduleName.includes('@') ? `'${moduleName}'` : moduleName
  return `  ${key}: ${version}`
}

function addOverride(yamlContent: string, moduleName: string, version: string): string {
  const lines = yamlContent.split('\n')

  const overridesIdx = lines.findIndex((line) => /^overrides:\s*$/.test(line))
  if (overridesIdx === -1) {
    throw new Error('Could not find "overrides:" section in pnpm-workspace.yaml')
  }

  let blockEnd = overridesIdx + 1
  while (blockEnd < lines.length) {
    const line = lines[blockEnd]
    if (line === '' || /^\s+/.test(line)) {
      blockEnd++
    } else {
      break
    }
  }

  const existingPattern = new RegExp(`^\\s+['"]?${escapeRegex(moduleName)}['"]?\\s*:`)
  const existingIdx = lines.findIndex(
    (line, idx) => idx > overridesIdx && idx < blockEnd && existingPattern.test(line)
  )

  if (existingIdx !== -1) {
    console.log(`\nWARNING: Override for "${moduleName}" already exists:`)
    console.log(`  ${lines[existingIdx].trim()}`)
    console.log(`  Replacing with: ${moduleName}: ${version}`)
    lines[existingIdx] = formatOverrideLine(moduleName, version)
    return lines.join('\n')
  }

  const newLine = formatOverrideLine(moduleName, version)
  lines.splice(blockEnd, 0, newLine)
  return lines.join('\n')
}

function findHighestVersionInLockfile(packageName: string): string | null {
  const lockfileContent = fs.readFileSync(LOCKFILE_PATH, 'utf-8')
  const escaped = escapeRegex(packageName)
  // pnpm lockfile v9 format:
  //   scoped:   `  '@org/pkg@x.y.z':`
  //   unscoped: `  pkg@x.y.z:`
  const pattern = packageName.startsWith('@')
    ? new RegExp(`^  '${escaped}@(\\d+\\.\\d+\\.\\d+)':`, 'gm')
    : new RegExp(`^  ${escaped}@(\\d+\\.\\d+\\.\\d+):`, 'gm')

  const versions: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(lockfileContent)) !== null) {
    versions.push(match[1])
  }

  if (versions.length === 0) return null
  return versions.sort(compareSemver).at(-1)!
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

interface BumpResult {
  previousVersion: string | null
  finalVersion: string | null
}

/**
 * Bumps a package to the given override version (or patch+1 of the current highest if omitted).
 * First tries a plain `pnpm install`; if that doesn't move the version, falls back to adding
 * a temporary override in pnpm-workspace.yaml. Reverts and throws on failure.
 */
export async function bumpPackage(
  packageName: string,
  overrideVersion?: string
): Promise<BumpResult> {
  const currentHighest = findHighestVersionInLockfile(packageName)

  let targetVersion: string
  if (overrideVersion) {
    targetVersion = overrideVersion
    console.log(`Package: ${packageName}`)
    if (currentHighest) console.log(`Current highest in lockfile: ${currentHighest}`)
    console.log(`Target version (explicit): ${targetVersion}`)
  } else {
    if (!currentHighest) {
      throw new Error(`Package "${packageName}" not found in pnpm-lock.yaml`)
    }
    const [major, minor, patch] = currentHighest.split('.').map(Number)
    targetVersion = `^${major}.${minor}.${patch + 1}`
    console.log(`Package: ${packageName}`)
    console.log(`Current highest in lockfile: ${currentHighest}`)
    console.log(`Target version (minimal bump): ${targetVersion}`)
  }

  // Attempt 1: plain pnpm install, no override
  console.log('\nAttempt 1: pnpm install (no override)...')
  execSync('pnpm install --silent', { stdio: 'pipe', encoding: 'utf-8' })

  const afterPlainInstall = findHighestVersionInLockfile(packageName)
  if (currentHighest && afterPlainInstall && compareSemver(afterPlainInstall, currentHighest) > 0) {
    console.log(
      `\n${packageName} bumped to ${afterPlainInstall} via plain install (no override needed).`
    )
    return { previousVersion: currentHighest, finalVersion: afterPlainInstall }
  }

  console.log('No change from plain install. Proceeding with override...')

  // Snapshot for revert
  const originalYaml = fs.readFileSync(WORKSPACE_YAML_PATH, 'utf-8')
  const originalLockfile = fs.readFileSync(LOCKFILE_PATH, 'utf-8')

  function revert(): void {
    console.log('\nReverting pnpm-workspace.yaml and pnpm-lock.yaml...')
    fs.writeFileSync(WORKSPACE_YAML_PATH, originalYaml, 'utf-8')
    fs.writeFileSync(LOCKFILE_PATH, originalLockfile, 'utf-8')
    console.log('Reverted to original state.')
  }

  // Attempt 2: add override
  console.log(`\nAttempt 2: adding override ${packageName}: ${targetVersion}`)
  const updatedYaml = addOverride(originalYaml, packageName, targetVersion)
  fs.writeFileSync(WORKSPACE_YAML_PATH, updatedYaml, 'utf-8')
  console.log('Updated pnpm-workspace.yaml')

  console.log('\nRunning pnpm install (with override)...')
  try {
    execSync('pnpm install', { stdio: 'pipe', encoding: 'utf-8' })
  } catch (error: any) {
    const output = (error.stdout ?? '') + (error.stderr ?? '')
    if (output.includes('ERR_PNPM_NO_MATCHING_VERSION')) {
      console.error(
        `\nNo matching version found for "${packageName}@${targetVersion}" — blocked by minimumReleaseAge.`
      )
      handleMinimumReleaseAgeError(output)
      revert()
      throw new Error(`Blocked by minimumReleaseAge`)
    }
    revert()
    throw error
  }

  // Remove override and re-install to let the lockfile bump stick on its own
  console.log('\nRemoving override and running pnpm install again...')
  fs.writeFileSync(WORKSPACE_YAML_PATH, originalYaml, 'utf-8')
  execSync('pnpm install --silent', { stdio: 'pipe', encoding: 'utf-8' })

  return {
    previousVersion: currentHighest,
    finalVersion: findHighestVersionInLockfile(packageName),
  }
}

async function main(): Promise<void> {
  const [packageName, versionArg] = process.argv.slice(2)

  if (!packageName) {
    console.error('Usage: ts-node scripts/bump-package.ts <package-name> [version]')
    process.exit(1)
  }

  const overrideVersion = versionArg ? `^${versionArg}` : undefined

  let result: BumpResult
  try {
    result = await bumpPackage(packageName, overrideVersion)
  } catch (error: any) {
    console.error(error.message ?? error)
    process.exit(1)
  }

  const { previousVersion, finalVersion } = result
  if (!finalVersion || (previousVersion && compareSemver(finalVersion, previousVersion) <= 0)) {
    console.error(
      `\nERROR: "${packageName}" was not bumped after removing override. ` +
        `Consider using scoped overrides or updating the parent dependency.`
    )
    process.exit(1)
  }

  console.log(`\nSUCCESS: ${packageName} bumped from ${previousVersion} to ${finalVersion}.`)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
