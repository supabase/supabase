import { cn } from 'ui'

interface TaxDisclaimerProps {
  className?: string
}

export const TaxDisclaimer = ({ className }: TaxDisclaimerProps) => {
  return (
    <p className={cn('text-xs text-foreground-muted', className)}>
      Prices shown do not include applicable taxes.
    </p>
  )
}
