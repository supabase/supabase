import { ArrowRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

const TARGETS = {
  'query-performance': { label: 'Query Performance', path: 'database/query-performance' },
  storage: { label: 'Storage', path: 'storage/buckets' },
} as const

/**
 * Jumps from a usage Egress section to the Studio surface where the user debugs
 * or changes config for that egress source: Query Performance for REST/API,
 * Storage for cached/storage. Project-scoped — disabled with a tooltip when no
 * single project is selected.
 */
export const EgressJumpButton = ({ target }: { target: keyof typeof TARGETS }) => {
  const [{ projectRef }] = useQueryStates({ projectRef: parseAsString })
  const { label, path } = TARGETS[target]

  if (!projectRef) {
    return (
      <ButtonTooltip
        disabled
        iconRight={<ArrowRightIcon />}
        tooltip={{ content: { side: 'bottom', text: `Select a single project to open ${label}` } }}
      >
        {label}
      </ButtonTooltip>
    )
  }

  return (
    <Button asChild iconRight={<ArrowRightIcon />}>
      <a href={`/project/${projectRef}/${path}`}>{label}</a>
    </Button>
  )
}
