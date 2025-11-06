import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'
import { Button, Card, CardContent } from 'ui'

export default function PageLayoutDetail() {
  return (
    <div className="w-full">
      <PageHeader.Root size="large">
        <PageHeader.Summary>
          <PageHeader.Title>Billing</PageHeader.Title>
          <PageHeader.Description>
            Manage your organization's billing and subscription settings.
          </PageHeader.Description>
        </PageHeader.Summary>
      </PageHeader.Root>

      <PageContainer size="large">
        <PageSection.Root orientation="horizontal">
          <PageSection.Summary>
            <PageSection.Title>Subscription</PageSection.Title>
            <PageSection.Description>
              View and manage your current subscription plan and billing cycle.
            </PageSection.Description>
          </PageSection.Summary>
          <PageSection.Content>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Current Plan</p>
                    <p className="text-sm font-medium">Pro Plan</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Billing Cycle</p>
                    <p className="text-sm">Monthly</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Next Billing Date</p>
                    <p className="text-sm">March 15, 2024</p>
                  </div>
                  <div className="pt-2">
                    <Button type="default" size="small">
                      Change Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageSection.Content>
        </PageSection.Root>

        <PageSection.Root orientation="horizontal">
          <PageSection.Summary>
            <PageSection.Title>Cost Control</PageSection.Title>
            <PageSection.Description>
              Set spending limits and alerts to manage your organization's costs.
            </PageSection.Description>
          </PageSection.Summary>
          <PageSection.Content>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Monthly Spending Limit</p>
                    <p className="text-sm">$500.00</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Current Month Spend</p>
                    <p className="text-sm">$234.50</p>
                  </div>
                  <div className="pt-2">
                    <Button type="default" size="small">
                      Configure Limits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageSection.Content>
        </PageSection.Root>

        <PageSection.Root orientation="horizontal">
          <PageSection.Summary>
            <PageSection.Title>Payment Methods</PageSection.Title>
            <PageSection.Description>
              Manage payment methods and billing information for your organization.
            </PageSection.Description>
          </PageSection.Summary>
          <PageSection.Content>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Primary Payment Method</p>
                    <p className="text-sm">•••• •••• •••• 4242</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-lighter mb-1">Expires</p>
                    <p className="text-sm">12/2025</p>
                  </div>
                  <div className="pt-2">
                    <Button type="default" size="small">
                      Update Payment Method
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageSection.Content>
        </PageSection.Root>
      </PageContainer>
    </div>
  )
}
