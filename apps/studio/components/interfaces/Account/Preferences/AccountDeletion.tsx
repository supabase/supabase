import { Admonition } from 'ui-patterns/Admonition'
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
          <PageSectionTitle>Delete account</PageSectionTitle>
          <PageSectionDescription>
            Permanently remove your Supabase account and its data.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Admonition
          type="danger"
          title="Deleting your account is permanent"
          description="Your data will be deleted within 30 days, but we may retain some metadata and logs for longer where required or permitted by law."
          actions={<DeleteAccountButton />}
          layout="responsive"
        />
      </PageSectionContent>
    </PageSection>
  )
}
