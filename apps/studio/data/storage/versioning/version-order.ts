type ArchivedAt = { archived_at?: string | null }

// A null archived_at marks the key's single current version, so it sorts first.
const archivedTime = (version: ArchivedAt) =>
  version.archived_at ? Date.parse(version.archived_at) : Number.MAX_SAFE_INTEGER

export const compareNewestVersionFirst = (a: ArchivedAt, b: ArchivedAt) =>
  archivedTime(b) - archivedTime(a)
