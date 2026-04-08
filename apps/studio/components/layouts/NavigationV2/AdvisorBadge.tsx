import { ActiveDot } from '@/components/ui/ActiveDot'
import { useLints } from '@/hooks/misc/useLints'

export function AdvisorBadge() {
  const { securityLints, errorLints } = useLints()

  return (
    <ActiveDot
      hasErrors={errorLints.length > 0}
      hasWarnings={securityLints.length > 0}
      className="top-1.5 right-1.5 left-auto"
    />
  )
}
