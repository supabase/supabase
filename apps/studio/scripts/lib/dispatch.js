const VALID_TARGETS = new Set(['dev', 'build', 'start'])

export function getPnpmSpawnOptions(platform = process.platform) {
  return { shell: platform === 'win32' }
}

export function getDispatchScript(target, studioFramework) {
  if (!VALID_TARGETS.has(target)) return null

  const framework = studioFramework === 'tanstack' ? 'tanstack' : 'next'
  return `${target}:${framework}`
}
