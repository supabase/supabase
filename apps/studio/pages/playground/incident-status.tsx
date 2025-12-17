import { useState } from 'react'

import { IS_PLATFORM } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'

type IncidentInfo = {
  id: string
  name: string
  status: string
  active_since: string
}

const IncidentStatusPlayground: NextPageWithLayout = () => {
  const [incidents, setIncidents] = useState<IncidentInfo[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)

  const fetchIncidents = async () => {
    console.log('[Incident Status Playground] Fetching incidents...')
    console.log(
      '[Incident Status Playground] Check server logs for STATUSPAGE_PAGE_ID and STATUSPAGE_API_KEY values'
    )

    setIsLoading(true)
    setError(null)
    setResponseStatus(null)
    setIncidents(null)

    try {
      const response = await fetch('/api/incident-status')
      setResponseStatus(response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setIncidents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
    } finally {
      setIsLoading(false)
    }
  }

  if (!IS_PLATFORM) {
    return (
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionTitle>Incident Status Playground</ScaffoldSectionTitle>
          <ScaffoldSectionDescription>
            This page is only available on the platform.
          </ScaffoldSectionDescription>
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <ScaffoldContainer className="w-full col-span-full">
      <ScaffoldSection className="w-full col-span-full">
        <div className="flex flex-col gap-y-4 w-full col-span-full">
          <div>
            <ScaffoldSectionTitle>Incident Status Playground</ScaffoldSectionTitle>
            <ScaffoldSectionDescription>
              Test the /api/incident-status endpoint to verify StatusPage API configuration.
            </ScaffoldSectionDescription>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Endpoint</CardTitle>
              <CardDescription>
                Click the button below to fetch active incidents from the StatusPage API.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-4">
              <Button onClick={fetchIncidents} disabled={isLoading} type="primary">
                {isLoading ? 'Fetching...' : 'Fetch Incidents'}
              </Button>

              {responseStatus !== null && (
                <div className="text-sm">
                  <span className="text-foreground-light">Response Status: </span>
                  <span className={responseStatus === 200 ? 'text-green-600' : 'text-destructive'}>
                    {responseStatus}
                  </span>
                </div>
              )}

              {error && (
                <Card className="bg-destructive/10 border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive font-medium">Error:</p>
                    <p className="text-destructive text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              {incidents && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Incidents ({incidents.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {incidents.length === 0 ? (
                      <p className="text-foreground-light">No active incidents found.</p>
                    ) : (
                      <div className="flex flex-col gap-y-4">
                        {incidents.map((incident) => (
                          <Card key={incident.id} className="bg-muted">
                            <CardContent className="pt-6">
                              <div className="flex flex-col gap-y-2">
                                <div>
                                  <span className="text-foreground-light text-sm">ID: </span>
                                  <span className="text-foreground text-sm font-mono">
                                    {incident.id}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-foreground-light text-sm">Name: </span>
                                  <span className="text-foreground text-sm font-medium">
                                    {incident.name}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-foreground-light text-sm">Status: </span>
                                  <span className="text-foreground text-sm">{incident.status}</span>
                                </div>
                                <div>
                                  <span className="text-foreground-light text-sm">
                                    Active Since:{' '}
                                  </span>
                                  <span className="text-foreground text-sm">
                                    {new Date(incident.active_since).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                STATUSPAGE_PAGE_ID and STATUSPAGE_API_KEY are configured server-side.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-light text-sm">
                Check the server console logs to verify if STATUSPAGE_PAGE_ID and STATUSPAGE_API_KEY
                are set. The API endpoint logs these values when it initializes.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

IncidentStatusPlayground.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

// eslint-disable-next-line no-restricted-exports
export default IncidentStatusPlayground
