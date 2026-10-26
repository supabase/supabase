import { CreditCardIcon } from 'lucide-react'

import { getCardBrandIconUrl } from './PaymentMethods.utils'

export const CardBrandIcon = ({ brand }: { brand: string | null | undefined }) => {
  const iconUrl = getCardBrandIconUrl(brand)

  if (!iconUrl) {
    return (
      <CreditCardIcon
        aria-label="Credit card"
        strokeWidth={1.5}
        className="h-6 w-8 text-foreground-lighter"
      />
    )
  }

  return <img alt="Credit card brand" src={iconUrl} width="32" />
}
