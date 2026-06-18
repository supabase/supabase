/**
 * Shared constants for contentListings linting.
 * Overview page scope is derived at lint time — see deriveOverviewPagePaths().
 */
export const BANNED_ORIENTATION_HEADINGS = [
  '## Get started',
  '## Going further',
  '### Get started',
  '### Going further',
  '## Next steps',
  '### Next steps',
] as const
