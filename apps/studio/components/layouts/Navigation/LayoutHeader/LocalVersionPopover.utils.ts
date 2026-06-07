type CLIVersionSemver = { major: number; minor: number; patch: number }

// [Joshen] Specifically in the syntax of `v0.0.0`
export const getSemver = (version?: string) => {
  if (!version) return undefined
  const [major, minor, patch] = version.slice(1).split('.')
  return { major: Number(major), minor: Number(minor), patch: Number(patch) }
}

export const semverLte = (a: CLIVersionSemver, b: CLIVersionSemver) => {
  if (
    a.major > b.major ||
    (a.major === b.major && a.minor > b.minor) ||
    (a.major === b.major && a.minor === b.minor && a.patch > b.patch)
  )
    return false
  return true
}

export const semverGte = (a: CLIVersionSemver, b: CLIVersionSemver) => {
  if (
    a.major < b.major ||
    (a.major === b.major && a.minor < b.minor) ||
    (a.major === b.major && a.minor === b.minor && a.patch < b.patch)
  )
    return false
  return true
}
