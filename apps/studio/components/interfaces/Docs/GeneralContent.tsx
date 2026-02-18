import { DocSection } from './DocSection'
import Authentication from '@/components/interfaces/Docs/Authentication'
import Introduction from '@/components/interfaces/Docs/Introduction'
import RpcIntroduction from '@/components/interfaces/Docs/Pages/Rpc/Introduction'
import TablesIntroduction from '@/components/interfaces/Docs/Pages/Tables/Introduction'
import { UserManagement } from '@/components/interfaces/Docs/Pages/UserManagement'

interface GeneralContentProps {
  page?: string
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

export const GeneralContent = ({ selectedLang, page, showApiKey }: GeneralContentProps) => {
  let selected = page?.toLowerCase()
  if (selected == 'intro' || selected == null) return <Introduction selectedLang={selectedLang} />
  if (selected == 'auth')
    return <Authentication selectedLang={selectedLang} showApiKey={showApiKey} />
  if (selected == 'users-management')
    return <UserManagement selectedLang={selectedLang} showApiKey={showApiKey} />
  if (selected == 'tables-intro') return <TablesIntroduction selectedLang={selectedLang} />
  if (selected == 'rpc-intro') return <RpcIntroduction />
  else
    return (
      <DocSection
        title="Not found"
        content={<p>Looks like you went somewhere that nobody knows.</p>}
      />
    )
}
