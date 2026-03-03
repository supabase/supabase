import { SignUpForm } from "@/components/sign-up-form";
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
            <PageHeaderTitle>Create account</PageHeaderTitle>
            <PageHeaderDescription>Sign up to publish marketplace listings</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection className="py-0">
          <PageSectionContent>
            <div className="mx-auto w-full max-w-sm">
              <SignUpForm />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  );
}
