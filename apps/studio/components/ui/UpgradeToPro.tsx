import { ReactNode } from 'react'

import { cn } from 'ui'
import { Admonition } from 'ui-patterns'
import { UpgradePlanButton } from './UpgradePlanButton'

interface UpgradeToProProps {
  icon?: ReactNode
  primaryText: string
  secondaryText: string
  plan?: 'Pro' | 'Team' | 'Enterprise'
  addon?: 'pitr' | 'customDomain' | 'spendCap' | 'computeSize'
  /** Used in the default message template for request upgrade dialog, e.g: "Upgrade to ..." */
  featureProposition?: string
  /** As an override for the button text in both upgrade + request to upgrade scenario */
  buttonText?: string
  /** Where the upgrade interest is coming from */
  source?: string
  disabled?: boolean
  fullWidth?: boolean
  layout?: 'vertical' | 'horizontal'
  variant?: 'default' | 'primary'
  className?: string
}

export const UpgradeToPro = ({
  icon,
  primaryText,
  secondaryText,
  plan: planToUpgrade = 'Pro',
  addon,
  featureProposition,
  buttonText,
  source = 'upgrade',
  disabled = false,
  fullWidth = false,
  layout = 'horizontal',
  variant = 'primary',
  className,
}: UpgradeToProProps) => {
  return (
    <Admonition
      type="default"
      icon={icon}
      layout={layout}
      title={primaryText}
      description={secondaryText}
      className={cn(fullWidth && 'border-0 rounded-none border-b', className)}
      actions={
        <UpgradePlanButton
          plan={planToUpgrade}
          addon={addon}
          source={source}
          featureProposition={featureProposition}
          disabled={disabled}
          variant={variant}
        >
          {buttonText}
        </UpgradePlanButton>
      }
    />
  )
}
