import { LoginForm } from "@/components/login-form";
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
            <PageHeaderTitle>Sign in</PageHeaderTitle>
            <PageHeaderDescription>Access your marketplace workspace</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection className="py-0">
          <PageSectionContent>
            <div className="mx-auto w-full max-w-sm">
              <LoginForm />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  );
}
