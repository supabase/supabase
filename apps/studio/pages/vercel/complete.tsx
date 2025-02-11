import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'
import { Loader } from 'lucide-react'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { createContext, useEffect, useState } from 'react'
import { Button } from 'ui'

const PageContext = createContext(null)
function IntegrationComplete() {
  const PageState = useLocalObservable(() => ({
    supabaseProjectRef: '',
    next: '',
    loadInitialData() {
      this.getQueryParams()
    },
    getQueryParams() {
      const params = new URLSearchParams(window.location.search)
      this.next = params.get('next') as string
      this.supabaseProjectRef = params.get('supabaseProjectRef') as string
    },
  }))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    PageState.loadInitialData()
  }, [])

  function onContinue() {
    setLoading(true)
    window.location.href = PageState.next
  }

  return (
    // @ts-ignore
    <PageContext.Provider value={PageState}>
      <VercelIntegrationLayout>
        <div className="mx-auto max-w-sm">
          <Loader className="animate-spin" size={30} />
          <p className="pt-4 text-lg">Your new project is spinning up</p>
          <p className="pt-2">This may take up to 2 mins, but you can continue on Vercel.</p>
          <div className="py-4">
            <a
              href={`/project/${PageState.supabaseProjectRef}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-1000"
            >
              Open Supabase Dashboard →
            </a>
          </div>

          <Button disabled={loading} loading={loading} onClick={onContinue} block>
            Finish
          </Button>
        </div>
      </VercelIntegrationLayout>
    </PageContext.Provider>
  )
}
export default observer(IntegrationComplete)
