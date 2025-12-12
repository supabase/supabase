import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, CriticalIcon } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { DeleteAccountButton } from './DeleteAccountButton'

export const AccountDeletion = () => {
  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Danger zone</PageSectionTitle>
          <PageSectionDescription>
            Permanently delete your Supabase account and data.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Alert_Shadcn_ variant="destructive">
          <CriticalIcon />
          <AlertTitle_Shadcn_>Request for account deletion</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Deleting your account is permanent and cannot be undone. Your data will be deleted
            within 30 days, but we may retain some metadata and logs for longer where required or
            permitted by law.
          </AlertDescription_Shadcn_>
          <AlertDescription_Shadcn_ className="mt-3">
            <DeleteAccountButton />
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
