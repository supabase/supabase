const VALID_TARGETS = new Set(['dev', 'build', 'start'])
const VALID_SCRIPTS = new Set(
  [...VALID_TARGETS].flatMap((target) => [`${target}:next`, `${target}:tanstack`])
)

export function getPnpmSpawnInvocation(script, platform = process.platform) {
  if (!VALID_SCRIPTS.has(script)) return null

  if (platform === 'win32') {
    return {
      command: `pnpm run ${script}`,
      args: [],
      options: { shell: true },
    }
  }

  return {
    command: 'pnpm',
    args: ['run', script],
    options: { shell: false },
  }
}

export function getDispatchScript(target, studioFramework) {
  if (!VALID_TARGETS.has(target)) return null

  const framework = studioFramework === 'tanstack' ? 'tanstack' : 'next'
  return `${target}:${framework}`
}
