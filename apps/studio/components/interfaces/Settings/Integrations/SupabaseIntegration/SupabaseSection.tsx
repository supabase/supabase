import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useIntegrationsDirectoryQuery } from 'data/integrations-directory/integrations-directory-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useState } from 'react'
import { Button, Sheet, SheetContent, SheetTrigger } from 'ui'
import { CreateIntegrationSheet } from './CreateIntegrationSheet'

const SupabaseSection = () => {
  const org = useSelectedOrganization()

  const { data } = useIntegrationsDirectoryQuery({ orgSlug: org?.slug })

  const [visible, setVisible] = useState(false)

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <ScaffoldSectionDetail title="Integrations Directory Entry">
          <p>
            Add your own integrations to{' '}
            <a className="cursor-pointer" href="https://supabase.com/partners/integrations">
              our Integrations Directory
            </a>
          </p>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          <div className="text-sm">Some nice description of the section.</div>

          {data?.id && data?.approved && (
            <div className="text-sm">
              View your own entry at https://supabase.com/integrations/{data.slug}
            </div>
          )}

          {data?.id && !data?.approved && (
            <div className="text-sm">
              Your entry awaits approval by Supabase team. In the meantime, you can see the preview
              at https://supabase.com/integrations/{data.slug} (available only to logged-in
              organization members.)
            </div>
          )}
          <Sheet open={visible} onOpenChange={(open) => setVisible(open)}>
            <SheetTrigger asChild>
              <Button type="outline">Open</Button>
            </SheetTrigger>
            <SheetContent showClose={false} className="flex flex-col gap-0">
              <CreateIntegrationSheet
                setVisible={(open) => setVisible(open)}
                integrationEntry={data}
              />
            </SheetContent>
          </Sheet>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default SupabaseSection
