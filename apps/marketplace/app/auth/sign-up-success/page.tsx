import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui";
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

export default function Page() {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Thank you for signing up</PageHeaderTitle>
            <PageHeaderDescription>Check your email to confirm your account</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection className="py-0">
          <PageSectionContent>
            <div className="mx-auto w-full max-w-sm">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
                  <CardDescription>Check your email to confirm</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve successfully signed up. Please check your email to
                    confirm your account before signing in.
                  </p>
                </CardContent>
              </Card>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  );
}
