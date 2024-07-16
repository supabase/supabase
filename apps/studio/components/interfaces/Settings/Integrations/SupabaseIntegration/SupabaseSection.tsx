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

  const { data } = useIntegrationsDirectoryQuery({ orgId: org?.id })

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
          <div className="text-sm">
            View your own entry at https://supabase.com/integrations/worker
          </div>
          <Sheet open={visible} onOpenChange={(open) => setVisible(open)}>
            <SheetTrigger asChild>
              <Button type="outline">Open</Button>
            </SheetTrigger>
            <SheetContent showClose={false} className="flex flex-col gap-0">
              <CreateIntegrationSheet setVisible={(open) => setVisible(open)} />
            </SheetContent>
          </Sheet>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default SupabaseSection
