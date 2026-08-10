import { useParams } from 'common'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'

import { HeaderBanner } from '../Organization/HeaderBanner'
import { useSelectedGitHubConfigDrift } from '@/hooks/misc/useGitHubConfigDrift'

export function GitHubConfigDriftBanner() {
  const { ref } = useParams()
  const { hasConfigurationIssues, summary } = useSelectedGitHubConfigDrift()

  const driftCount = summary.driftedFields.length
  const settingsLabel = `${driftCount} managed ${driftCount === 1 ? 'setting differs' : 'settings differ'}`

  return (
    <AnimatePresence initial={false}>
      {hasConfigurationIssues && ref && (
        <HeaderBanner
          key="github-config-drift-banner"
          variant="warning"
          title="Code configuration needs attention"
          description={
            <>
              Current environment values are active; {settingsLabel}.{' '}
              <Link href={`/project/${ref}/settings/configuration-drift`}>Review configuration</Link>
            </>
          }
        />
      )}
    </AnimatePresence>
  )
}
