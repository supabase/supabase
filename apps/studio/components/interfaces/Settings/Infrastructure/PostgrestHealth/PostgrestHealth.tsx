import { useState } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw, Tool, Activity } from 'lucide-react'
import { Button, Badge } from 'ui'
import {
  ScaffoldSection,
  ScaffoldSectionDetail,
  ScaffoldSectionContent,
} from '@/components/layouts/Scaffold'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useParams } from 'common'

interface PostgrestHealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
  schema_cache?: {
    authenticator_exists: boolean
    authenticator_has_schema_usage: boolean
    exposed_schema_count: number
    public_table_count: number
    has_advisory_locks: boolean
  }
  replication_slots?: any[]
}

export const PostgrestHealth = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isLoading, setIsLoading] = useState(false)
  const [healthStatus, setHealthStatus] = useState<PostgrestHealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // This would call the database function via the API
      // For now, this is a placeholder for the actual implementation
      const response = await fetch(`/rest/v1/rpc/get_postgrest_health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to check PostgREST health')
      }
      
      const data = await response.json()
      setHealthStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'critical':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base m-0">PostgREST Health</h4>
            <p className="text-sm text-foreground-light mt-1">
              Monitor and troubleshoot PostgREST schema cache issues
            </p>
          </div>
          <Button
            type="default"
            icon={isLoading ? <RefreshCw className="animate-spin" /> : <Activity />}
            onClick={checkHealth}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Health'}
          </Button>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {healthStatus && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${getStatusColor(healthStatus.status)}`}>
              {getStatusIcon(healthStatus.status)}
              <span className="text-sm font-medium capitalize">{healthStatus.status}</span>
            </div>

            {/* Issues */}
            {healthStatus.issues.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Issues Detected</h5>
                <ul className="space-y-1">
                  {healthStatus.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-foreground-light flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {healthStatus.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                <ul className="space-y-1">
                  {healthStatus.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-foreground-light flex items-start gap-2">
                      <Tool className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Schema Cache Details */}
            {healthStatus.schema_cache && (
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium mb-3">Schema Cache Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-light">Authenticator Role:</span>
                    <Badge 
                      variant={healthStatus.schema_cache.authenticator_exists ? 'success' : 'error'}
                      className="ml-2"
                    >
                      {healthStatus.schema_cache.authenticator_exists ? 'Exists' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-foreground-light">Schema Permissions:</span>
                    <Badge 
                      variant={healthStatus.schema_cache.authenticator_has_schema_usage ? 'success' : 'error'}
                      className="ml-2"
                    >
                      {healthStatus.schema_cache.authenticator_has_schema_usage ? 'Granted' : 'Missing'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-foreground-light">Exposed Schemas:</span>
                    <span className="ml-2">{healthStatus.schema_cache.exposed_schema_count}</span>
                  </div>
                  <div>
                    <span className="text-foreground-light">Public Tables:</span>
                    <span className="ml-2">{healthStatus.schema_cache.public_table_count}</span>
                  </div>
                  <div>
                    <span className="text-foreground-light">Advisory Locks:</span>
                    <Badge 
                      variant={healthStatus.schema_cache.has_advisory_locks ? 'warning' : 'success'}
                      className="ml-2"
                    >
                      {healthStatus.schema_cache.has_advisory_locks ? 'Present' : 'None'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="default"
                icon={<RefreshCw size={14} />}
                size="small"
                onClick={() => {
                  // Trigger schema reload
                  console.log('Reload schema cache')
                }}
              >
                Reload Schema Cache
              </Button>
              <Button
                type="default"
                icon={<Tool size={14} />}
                size="small"
                onClick={() => {
                  // Fix permissions
                  console.log('Fix permissions')
                }}
              >
                Fix Permissions
              </Button>
              <Button
                type="default"
                icon={<Activity size={14} />}
                size="small"
                onClick={() => {
                  // Restart PostgREST
                  console.log('Restart PostgREST')
                }}
              >
                Restart PostgREST
              </Button>
            </div>
          </div>
        )}

        {!healthStatus && !error && (
          <div className="text-center py-8 text-foreground-light">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Check Health" to diagnose PostgREST schema cache issues</p>
          </div>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}