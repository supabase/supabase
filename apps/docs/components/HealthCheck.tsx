import { useState, useEffect } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useTheme } from 'next-themes'

interface HealthCheckProps {
  className?: string
}

interface HealthCheckResponse {
  healthy: boolean
  services: {
    database: boolean
    auth: boolean
    realtime: boolean
    storage: boolean
    vector: boolean
  }
}

const HealthCheck = ({ className = '' }: HealthCheckProps) => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Health check failed:', error)
        setHealth({
          healthy: false,
          services: {
            database: false,
            auth: false,
            realtime: false,
            storage: false,
            vector: false,
          },
        })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Checking health...</span>
      </div>
    )
  }

  if (!health) {
    return null
  }

  const allServicesHealthy = Object.values(health.services).every((service) => service)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`h-2 w-2 rounded-full ${allServicesHealthy ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {allServicesHealthy ? 'All systems operational' : 'Some services are degraded'}
      </span>
      <div className="hidden md:flex items-center gap-4">
        {Object.entries(health.services).map(([service, isHealthy]) => (
          <div key={service} className="flex items-center gap-1">
            {isHealthy ? (
              <IconCheck className="h-3 w-3 text-green-500" />
            ) : (
              <IconX className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs capitalize text-gray-500 dark:text-gray-400">{service}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HealthCheck