/**
 * Dev branches are created by the CLI with a naming convention:
 *   {parent-branch-name}/env__{member-id}
 * e.g. "feat/env__user-abc123"
 *
 * The delimiter "/env__" separates the parent branch name from the member ID.
 */

const DEV_BRANCH_DELIMITER = '/env__'

/**
 * Returns true if the branch name matches the dev branch naming convention.
 */
export function isDevBranch(name: string): boolean {
  return name.includes(DEV_BRANCH_DELIMITER)
}

/**
 * Extracts the parent branch name from a dev branch name.
 * Returns null if the name doesn't match the dev branch convention.
 *
 * Example: "feat/env__user-abc123" -> "feat"
 * Example: "feature/my-branch/env__user-abc123" -> "feature/my-branch"
 */
export function getDevBranchParentName(name: string): string | null {
  const idx = name.indexOf(DEV_BRANCH_DELIMITER)
  if (idx === -1) return null
  return name.substring(0, idx)
}

/**
 * Extracts the member ID from a dev branch name.
 * Returns null if the name doesn't match the dev branch convention.
 *
 * Example: "feat/env__user-abc123" -> "user-abc123"
 */
export function getDevBranchMemberId(name: string): string | null {
  const idx = name.indexOf(DEV_BRANCH_DELIMITER)
  if (idx === -1) return null
  return name.substring(idx + DEV_BRANCH_DELIMITER.length)
}
