import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'

interface CustomEmailTemplateRestrictionAdmonitionProps {
  projectRef?: string
}

export const CustomEmailTemplateRestrictionAdmonition = ({
  projectRef,
}: CustomEmailTemplateRestrictionAdmonitionProps) => {
  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Custom templates require Custom SMTP or Pro"
      description="This project can view the default email templates, but editing subject lines or HTML is disabled while it uses Supabase's built-in email service on the Free plan. Set up Custom SMTP, configure a send-email hook, or upgrade to Pro to customise templates."
      actions={
        <>
          <Button asChild type="default">
            <Link href={`/project/${projectRef ?? '_'}/auth/smtp`}>Set up SMTP</Link>
          </Button>
          <Button asChild type="default">
            <Link href={`/project/${projectRef ?? '_'}/auth/hooks`}>Configure hook</Link>
          </Button>
          <UpgradePlanButton
            source="authEmailTemplates"
            variant="default"
            featureProposition="customise Auth email templates"
          >
            Upgrade to Pro
          </UpgradePlanButton>
        </>
      }
    />
  )
}
