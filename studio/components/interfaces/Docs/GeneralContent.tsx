import Introduction from 'components/to-be-cleaned/Docs/Pages/Introduction'
import Authentication from 'components/to-be-cleaned/Docs/Pages/Authentication'
import TablesIntroduction from 'components/to-be-cleaned/Docs/Pages/Tables/Introduction'
import UserManagement from 'components/to-be-cleaned/Docs/Pages/UserManagement'
import RpcIntroduction from 'components/to-be-cleaned/Docs/Pages/Rpc/Introduction'

const GeneralContent = ({ autoApiService, selectedLang, page, showApiKey }: any) => {
  let selected = page?.toLowerCase()
  if (selected == 'intro' || selected == null)
    return <Introduction autoApiService={autoApiService} selectedLang={selectedLang} />
  if (selected == 'auth')
    return (
      <Authentication
        autoApiService={autoApiService}
        selectedLang={selectedLang}
        showApiKey={showApiKey}
      />
    )
  if (selected == 'users')
    return (
      <UserManagement
        autoApiService={autoApiService}
        selectedLang={selectedLang}
        showApiKey={showApiKey}
      />
    )
  if (selected == 'tables-intro') return <TablesIntroduction selectedLang={selectedLang} />
  if (selected == 'rpc-intro') return <RpcIntroduction />
  else
    return (
      <div>
        <h2 className="m-4">Not found</h2>
        <p className="m-4"> Looks like you went somewhere that nobody knows.</p>
      </div>
    )
}

export default GeneralContent
