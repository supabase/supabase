import Panel from 'components/ui/Panel'

const APIKeys = () => {
  return (
    <Panel
      title={
        <div className="space-y-3">
          <h5 className="text-base">Project API</h5>
          <p className="text-sm text-scale-1000">
            Your API is secured behind an API gateway which requires an API Key for every request.
            <br />
            You can use the keys below to use Supabase client libraries.
          </p>
        </div>
      }
    ></Panel>
  )
}

export default APIKeys
