import { CheckCircle2, CircleDashed, Loader2 } from 'lucide-react'

import { InlineLink } from '@/components/ui/InlineLink'

interface ComplianceRequirementRowProps {
  label: string
  href: string
  isMet: boolean
  isLoading: boolean
}

const iconProps = { size: 14, strokeWidth: 1.5 }

export const ComplianceRequirementRow = ({
  label,
  href,
  isMet,
  isLoading,
}: ComplianceRequirementRowProps) => {
  return (
    <div className="flex items-center gap-x-2 text-sm">
      {isLoading ? (
        <Loader2 {...iconProps} className="animate-spin text-foreground-lighter" />
      ) : isMet ? (
        <CheckCircle2 {...iconProps} className="text-brand" />
      ) : (
        <CircleDashed {...iconProps} className="text-warning" />
      )}
      <InlineLink href={href} className={isMet ? 'text-foreground-light' : 'text-warning'}>
        {label}
      </InlineLink>
    </div>
  )
}
