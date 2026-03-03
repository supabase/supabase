import { ForgotPasswordForm } from "@/components/forgot-password-form";
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
            <PageHeaderTitle>Forgot password</PageHeaderTitle>
            <PageHeaderDescription>Request a password reset email</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection className="py-0">
          <PageSectionContent>
            <div className="mx-auto w-full max-w-sm">
              <ForgotPasswordForm />
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  );
}
