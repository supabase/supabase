import { IS_PLATFORM } from 'common'

import { getServerFlags, type TrustedUserEmail } from '@/lib/server/configcat'

// Notebooks haven't shipped yet — they're gated behind the Explorer feature flag on the
// client (`useFlag('explorer')`). The AI tools that read notebook content (list_notebooks,
// get_notebook in lib/ai/tools/notebook-tools.ts) must not be advertised to the assistant until
// this resolves true for the requesting user, otherwise the assistant will believe notebooks
// exist for users who can't yet see them in the UI.
//
// Takes TrustedUserEmail, not a plain string: callers must go through
// lib/server/configcat's trustedUserEmail() to prove this came from a verified source
// (a decoded, signature-checked JWT claim), not a raw request param.
export async function isExplorerEnabled(userEmail?: TrustedUserEmail): Promise<boolean> {
  if (!IS_PLATFORM) return false

  const flags = await getServerFlags(userEmail)
  return flags.some((flag) => flag.settingKey === 'explorer' && flag.settingValue === true)
}
