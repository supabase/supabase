import { Card, CardContent, CardHeader, CardTitle } from "ui";
import { Suspense } from "react";
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Authentication error</PageHeaderTitle>
            <PageHeaderDescription>We could not complete your request</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection className="py-0">
          <PageSectionContent>
            <div className="mx-auto w-full max-w-sm">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense>
                    <ErrorContent searchParams={searchParams} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  );
}
