import { ReactNode } from 'react'

interface UpgradeToProProps {
  icon?: ReactNode
  primaryText: string
  secondaryText: string
  plan?: 'Pro' | 'Team' | 'Enterprise'
  addon?: 'pitr' | 'customDomain' | 'ipv4' | 'spendCap' | 'computeSize'
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
  docsUrl?: string
}

// [console fork] Self-hosted: nothing is plan-gated, so never show upgrade prompts.
export const UpgradeToPro = (_props: UpgradeToProProps) => null
