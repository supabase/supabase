import { getServerFlags, IS_PLATFORM } from 'common'

// Notebooks haven't shipped yet — they're gated behind the Explorer feature flag on the
// client (`useFlag('explorer')`). The AI tools that read notebook content (list_notebooks,
// get_notebook in lib/ai/tools/notebook-tools.ts) must not be advertised to the assistant until
// this resolves true for the requesting user, otherwise the assistant will believe notebooks
// exist for users who can't yet see them in the UI.
export async function isExplorerEnabled(userEmail?: string): Promise<boolean> {
  if (!IS_PLATFORM) return false

  const flags = await getServerFlags(userEmail)
  return flags.some((flag) => flag.settingKey === 'explorer' && flag.settingValue === true)
}
