import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { Admonition } from 'ui-patterns'

export const UpgradeExistingOrganizationCallout = () => {
  return (
    <Panel.Content>
      <Admonition
        type="default"
        title="Looking to upgrade an existing project?"
        description={
          <div>
            <p className="text-sm text-foreground-light">
              Supabase{' '}
              <InlineLink href="https://supabase.com/docs/guides/platform/billing-on-supabase">
                bills per organization
              </InlineLink>
              . If you want to upgrade your existing projects,{' '}
              <InlineLink href="/org/_/billing?panel=subscriptionPlan">
                upgrade your existing organization
              </InlineLink>{' '}
              instead.
            </p>
          </div>
        }
      />
    </Panel.Content>
  )
}
