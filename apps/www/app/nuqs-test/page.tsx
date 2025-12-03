'use client'

import { useEffect } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import { Button } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'

export default function ContributePage() {
  const [testParam, setTestParam] = useQueryState('test', parseAsString.withDefault(''))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('URL Parameter on load/refresh:', testParam || '(empty)')
      console.log('Full URL:', window.location.href)
    }
  }, [])

  function handleClick() {
    setTestParam('working')
  }

  return (
    <DefaultLayout>
      <div className="grid gap-4 p-8">
        <h1 className="text-2xl font-bold">Nuqs test page</h1>
        <div className="grid gap-2">
          <div className="rounded-lg border p-4 bg-muted">
            <p className="font-semibold mb-2">Test Parameter Value:</p>
            <p className="text-lg font-mono">
              {testParam ? (
                <span className="text-green-600">{testParam}</span>
              ) : (
                <span className="text-muted-foreground">(empty)</span>
              )}
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-muted">
            <p className="font-semibold mb-2">Current URL:</p>
            <p className="text-sm font-mono break-all">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          <Button onClick={handleClick}>Add Test Param to URL</Button>
          {testParam && (
            <Button onClick={() => setTestParam(null)} type="outline">
              Clear Test Param
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {testParam
            ? '✅ Parameter persists on refresh! Check the URL bar and console.'
            : 'Click the button above to add a test parameter, then refresh the page to verify it persists.'}
        </p>
      </div>
    </DefaultLayout>
  )
}
