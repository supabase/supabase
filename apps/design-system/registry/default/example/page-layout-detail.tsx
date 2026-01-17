import { Button, Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export default function PageLayoutDetail() {
  return (
    <div className="w-full">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Billing</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your organization&apos;s billing and subscription settings.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection orientation="horizontal">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Subscription</PageSectionTitle>
              <PageSectionDescription>
                View and manage your current subscription plan and billing cycle.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
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
          </PageSectionContent>
        </PageSection>

        <PageSection orientation="horizontal">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Cost control</PageSectionTitle>
              <PageSectionDescription>
                Set spending limits and alerts to manage your organization&apos;s costs.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
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
          </PageSectionContent>
        </PageSection>

        <PageSection orientation="horizontal">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Payment Methods</PageSectionTitle>
              <PageSectionDescription>
                Manage payment methods and billing information for your organization.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
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
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </div>
  )
}
