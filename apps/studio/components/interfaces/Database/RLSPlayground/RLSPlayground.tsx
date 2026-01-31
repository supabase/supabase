import { useState, useCallback } from 'react'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  useRLSPlaygroundTablesQuery,
  useRLSPlaygroundRolesQuery,
  useRLSPlaygroundPoliciesQuery,
  useRLSSimulateMutation,
  RLSSimulationContext,
  RLSSimulationResult,
} from 'data/rls-playground'
import { RLSContextEditor } from './RLSContextEditor'
import { RLSTableSelector } from './RLSTableSelector'
import { RLSPolicyList } from './RLSPolicyList'
import { RLSResultsTable } from './RLSResultsTable'
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'
import { Play, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export const RLSPlayground = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedSchema, setSelectedSchema] = useState('public')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [operation, setOperation] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'>('SELECT')
  const [context, setContext] = useState<RLSSimulationContext>({
    role: 'authenticated',
    jwtClaims: {
      sub: 'user-123',
      role: 'authenticated',
      email: 'user@example.com',
    },
  })
  const [simulationResult, setSimulationResult] = useState<RLSSimulationResult | null>(null)

  const { data: tables, isLoading: tablesLoading } = useRLSPlaygroundTablesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
  })

  const { data: roles } = useRLSPlaygroundRolesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const { data: policies, isLoading: policiesLoading } = useRLSPlaygroundPoliciesQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
    table: selectedTable ?? undefined,
  })

  const { mutate: simulate, isPending: isSimulating } = useRLSSimulateMutation({
    onSuccess: (data) => {
      setSimulationResult(data)
      if (data.error) {
        toast.error(`Simulation error: ${data.error}`)
      } else {
        toast.success(
          `Simulation complete: ${data.accessible_rows}/${data.total_rows_without_rls} rows accessible`
        )
      }
    },
    onError: (error) => {
      toast.error(`Failed to simulate: ${error.message}`)
    },
  })

  const handleSimulate = useCallback(() => {
    if (!ref || !selectedTable) return

    simulate({
      projectRef: ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
      table: selectedTable,
      operation,
      context,
      limit: 50,
    })
  }, [ref, project, selectedSchema, selectedTable, operation, context, simulate])

  const selectedTableData = tables?.find((t) => t.name === selectedTable)

  return (
    <div className="flex flex-col gap-6">
      {/* Table Selection & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Table Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Table</CardTitle>
          </CardHeader>
          <CardContent>
            <RLSTableSelector
              tables={tables ?? []}
              selectedTable={selectedTable}
              onSelectTable={setSelectedTable}
              isLoading={tablesLoading}
            />
          </CardContent>
        </Card>

        {/* Right: Context Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Simulation Context</CardTitle>
          </CardHeader>
          <CardContent>
            <RLSContextEditor
              context={context}
              onContextChange={setContext}
              availableRoles={roles ?? ['anon', 'authenticated', 'service_role']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Operation Selection & Run */}
      {selectedTable && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tabs value={operation} onValueChange={(v) => setOperation(v as any)}>
                  <TabsList>
                    <TabsTrigger value="SELECT">SELECT</TabsTrigger>
                    <TabsTrigger value="INSERT">INSERT</TabsTrigger>
                    <TabsTrigger value="UPDATE">UPDATE</TabsTrigger>
                    <TabsTrigger value="DELETE">DELETE</TabsTrigger>
                  </TabsList>
                </Tabs>

                {selectedTableData && (
                  <div className="flex items-center gap-2 text-sm">
                    {selectedTableData.rls_enabled ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-brand" />
                        <span className="text-foreground-light">RLS Enabled</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-warning">RLS Disabled</span>
                      </>
                    )}
                    <span className="text-foreground-lighter">
                      • {selectedTableData.policy_count} policies
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                onClick={handleSimulate}
                loading={isSimulating}
                disabled={!selectedTable}
                icon={<Play className="h-4 w-4" />}
              >
                Run Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies & Results */}
      {selectedTable && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Policies for this table */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Policies for {selectedTable}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RLSPolicyList
                policies={policies ?? []}
                operation={operation}
                isLoading={policiesLoading}
              />
            </CardContent>
          </Card>

          {/* Right: Simulation Results */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Simulation Results
                {simulationResult && (
                  <span className="text-sm font-normal text-foreground-light">
                    ({simulationResult.accessible_rows} of {simulationResult.total_rows_without_rls}{' '}
                    rows accessible)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RLSResultsTable
                result={simulationResult}
                policies={policies ?? []}
                isLoading={isSimulating}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
