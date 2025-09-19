import { useMemo, useState } from 'react'
import { useParams } from 'common'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, Button } from 'ui'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { useSharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'

// Simple thresholds for proof of concept - focusing on API metrics that are available
const PRODUCT_THRESHOLDS = {
  realtime: {
    errorRate: 5, // % of requests that are errors
    avgResponseTime: 1000, // ms
    totalRequestsPerHour: 1000, // requests per hour
    slowRequestThreshold: 2000, // ms for considering a request slow
  },
  functions: {
    errorRate: 10, // % of requests that are errors
    avgResponseTime: 3000, // ms
    totalRequestsPerHour: 500, // requests per hour
    slowRequestThreshold: 5000, // ms for considering a request slow
  },
  storage: {
    errorRate: 3, // % of requests that are errors
    avgResponseTime: 2000, // ms
    totalRequestsPerHour: 2000, // requests per hour
    slowRequestThreshold: 4000, // ms for considering a request slow
  },
}

// Mock data for testing the advisory interface
const MOCK_DATA = {
  realtime: {
    totalRequests: [
      { count: 150, timestamp: '2025-09-18T12:00:00Z' },
      { count: 200, timestamp: '2025-09-18T13:00:00Z' },
    ],
    errorCounts: [
      { count: 15, timestamp: '2025-09-18T12:00:00Z' },
      { count: 20, timestamp: '2025-09-18T13:00:00Z' },
    ],
    responseSpeed: [
      { avg: 1200, timestamp: '2025-09-18T12:00:00Z' },
      { avg: 1500, timestamp: '2025-09-18T13:00:00Z' },
    ],
    topSlowRoutes: [
      { path: '/realtime/v1/websocket', avg: 2500, count: 50 },
      { path: '/realtime/v1/channels', avg: 1800, count: 30 },
    ],
  },
  functions: {
    totalRequests: [
      { count: 80, timestamp: '2025-09-18T12:00:00Z' },
      { count: 120, timestamp: '2025-09-18T13:00:00Z' },
    ],
    errorCounts: [
      { count: 25, timestamp: '2025-09-18T12:00:00Z' },
      { count: 30, timestamp: '2025-09-18T13:00:00Z' },
    ],
    responseSpeed: [
      { avg: 4200, timestamp: '2025-09-18T12:00:00Z' },
      { avg: 6800, timestamp: '2025-09-18T13:00:00Z' },
    ],
    topSlowRoutes: [
      { path: '/functions/v1/heavy-computation', avg: 8500, count: 15 },
      { path: '/functions/v1/data-processing', avg: 5200, count: 25 },
    ],
  },
  storage: {
    totalRequests: [
      { count: 300, timestamp: '2025-09-18T12:00:00Z' },
      { count: 450, timestamp: '2025-09-18T13:00:00Z' },
    ],
    errorCounts: [
      { count: 5, timestamp: '2025-09-18T12:00:00Z' },
      { count: 8, timestamp: '2025-09-18T13:00:00Z' },
    ],
    responseSpeed: [
      { avg: 800, timestamp: '2025-09-18T12:00:00Z' },
      { avg: 1200, timestamp: '2025-09-18T13:00:00Z' },
    ],
    topSlowRoutes: [
      { path: '/storage/v1/object/large-files', avg: 4500, count: 20 },
    ],
  },
}

interface AdvisoryItem {
  id: string
  title: string
  description: string
  severity: 'error' | 'warning' | 'info'
  metric: string
  currentValue: number
  threshold: number
  recommendation: string
}

const ProductAdvisor: NextPageWithLayout = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [useMockData, setUseMockData] = useState(true) // Toggle for testing

  const {
    selectedDateRange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  // Fetch API metrics using SharedAPIReport - but use mock data for now
  const {
    data: realtimeData,
    isLoading: realtimeIsLoading,
    refetch: realtimeRefetch,
    isRefetching: realtimeIsRefetching,
  } = useSharedAPIReport({
    filterBy: 'realtime',
    start: selectedDateRange?.period_start?.date || '',
    end: selectedDateRange?.period_end?.date || '',
    enabled: !!selectedDateRange && !useMockData,
  })

  const {
    data: functionsData,
    isLoading: functionsIsLoading,
    refetch: functionsRefetch,
    isRefetching: functionsIsRefetching,
  } = useSharedAPIReport({
    filterBy: 'functions',
    start: selectedDateRange?.period_start?.date || '',
    end: selectedDateRange?.period_end?.date || '',
    enabled: !!selectedDateRange && !useMockData,
  })

  const {
    data: storageData,
    isLoading: storageIsLoading,
    refetch: storageRefetch,
    isRefetching: storageIsRefetching,
  } = useSharedAPIReport({
    filterBy: 'storage',
    start: selectedDateRange?.period_start?.date || '',
    end: selectedDateRange?.period_end?.date || '',
    enabled: !!selectedDateRange && !useMockData,
  })

  // Calculate advisory items organized by product
  const productAdvisories = useMemo(() => {
    // Helper function to calculate advisory items for a product
    const calculateAdvisoryItems = (
      productName: string,
      apiData: any,
      thresholds: any
    ): AdvisoryItem[] => {
      const items: AdvisoryItem[] = []

      if (!apiData) {
        return items
      }

      // Calculate API metrics
      const totalRequests = apiData.totalRequests?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0
      const totalErrors = apiData.errorCounts?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

      const avgResponseTime = apiData.responseSpeed?.reduce((sum: number, item: any) => {
        return sum + (item.avg || 0)
      }, 0) / (apiData.responseSpeed?.length || 1) || 0

      // Calculate requests per hour (approximate based on data points and time range)
      const timeRangeHours = selectedDateRange ?
        Math.max(1, (new Date(selectedDateRange.period_end.date).getTime() - new Date(selectedDateRange.period_start.date).getTime()) / (1000 * 60 * 60)) : 1
      const requestsPerHour = totalRequests / timeRangeHours

      // Check for slow requests (routes with high average response time)
      const slowRoutes = apiData.topSlowRoutes?.filter((route: any) => {
        // Handle both avg field (from our mock data) and actual API response structure
        const responseTime = route.avg || route.response_time || 0
        return responseTime > thresholds.slowRequestThreshold
      }) || []

      const productDisplayName = productName.charAt(0).toUpperCase() + productName.slice(1)

      // Check thresholds and create advisory items
      if (errorRate > thresholds.errorRate) {
        items.push({
          id: `${productName}-high-error-rate`,
          title: `${productDisplayName}: High Error Rate Detected`,
          description: `${productDisplayName} API error rate is ${errorRate.toFixed(1)}%, which exceeds the recommended threshold.`,
          severity: errorRate > thresholds.errorRate * 2 ? 'error' : 'warning',
          metric: 'Error Rate (%)',
          currentValue: errorRate,
          threshold: thresholds.errorRate,
          recommendation: `Review recent changes, check for client-side connection issues, and verify ${productName} configuration.`,
        })
      }

      if (avgResponseTime > thresholds.avgResponseTime) {
        items.push({
          id: `${productName}-slow-response-time`,
          title: `${productDisplayName}: Slow Average Response Time`,
          description: `Average ${productDisplayName} API response time is ${avgResponseTime.toFixed(0)}ms, which may impact user experience.`,
          severity: avgResponseTime > thresholds.avgResponseTime * 2 ? 'error' : 'warning',
          metric: 'Avg Response Time (ms)',
          currentValue: avgResponseTime,
          threshold: thresholds.avgResponseTime,
          recommendation: `Consider optimizing ${productName} operations, reviewing connection pooling, or scaling your infrastructure.`,
        })
      }

      if (requestsPerHour > thresholds.totalRequestsPerHour) {
        items.push({
          id: `${productName}-high-request-volume`,
          title: `${productDisplayName}: High Request Volume`,
          description: `${productDisplayName} API is receiving ${requestsPerHour.toFixed(0)} requests per hour, which may indicate high load.`,
          severity: requestsPerHour > thresholds.totalRequestsPerHour * 2 ? 'warning' : 'info',
          metric: 'Requests/Hour',
          currentValue: requestsPerHour,
          threshold: thresholds.totalRequestsPerHour,
          recommendation: `Monitor ${productName} load patterns and consider implementing rate limiting or caching strategies.`,
        })
      }

      if (slowRoutes.length > 0) {
        items.push({
          id: `${productName}-slow-routes-detected`,
          title: `${productDisplayName}: Slow Routes Detected`,
          description: `${slowRoutes.length} ${productName} route(s) have response times exceeding ${thresholds.slowRequestThreshold}ms.`,
          severity: 'warning',
          metric: 'Slow Routes Count',
          currentValue: slowRoutes.length,
          threshold: 0,
          recommendation: `Review and optimize these ${productName} routes: ${slowRoutes.map((r: any) => r.path || r.route || 'unknown route').join(', ')}.`,
        })
      }

      return items
    }

    // Use mock data if enabled, otherwise use real data
    const dataToUse = useMockData ? MOCK_DATA : {
      realtime: realtimeData,
      functions: functionsData,
      storage: storageData,
    }

    return {
      realtime: {
        name: 'Realtime',
        items: calculateAdvisoryItems('realtime', dataToUse.realtime, PRODUCT_THRESHOLDS.realtime)
      },
      functions: {
        name: 'Edge Functions',
        items: calculateAdvisoryItems('functions', dataToUse.functions, PRODUCT_THRESHOLDS.functions)
      },
      storage: {
        name: 'Storage',
        items: calculateAdvisoryItems('storage', dataToUse.storage, PRODUCT_THRESHOLDS.storage)
      }
    }
  }, [useMockData, realtimeData, functionsData, storageData, selectedDateRange])

  // Total advisory items count
  const totalAdvisoryItems = Object.values(productAdvisories).reduce((sum, product) => sum + product.items.length, 0)

  const onRefresh = async () => {
    setIsRefreshing(true)
    if (!useMockData) {
      await Promise.all([realtimeRefetch(), functionsRefetch(), storageRefetch()])
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const isLoading = !useMockData && (realtimeIsLoading || functionsIsLoading || storageIsLoading)
  const isRefetchingAny = !useMockData && (realtimeIsRefetching || functionsIsRefetching || storageIsRefetching) || isRefreshing

  const getSeverityIcon = (severity: AdvisoryItem['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />
      case 'info':
        return <CheckCircle className="h-5 w-5 text-brand" />
      default:
        return <CheckCircle className="h-5 w-5 text-foreground-muted" />
    }
  }

  const getSeverityColor = (severity: AdvisoryItem['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'warning'
      case 'info':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Product Advisory"
        docsUrl="https://supabase.com/docs/guides/platform"
        actions={
          <div className="flex gap-2">
            <Button
              type="outline"
              onClick={() => setUseMockData(!useMockData)}
            >
              {useMockData ? 'Use Real Data' : 'Use Mock Data'}
            </Button>
            <Button
              type="default"
              disabled={isRefetchingAny}
              icon={<RefreshCw className={isRefetchingAny ? 'animate-spin' : ''} />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-foreground-light">Loading product metrics...</div>
          </div>
        ) : (
          <>
            {totalAdvisoryItems === 0 ? (
              <Alert_Shadcn_ className="border-brand bg-brand/5">
                <CheckCircle className="h-4 w-4 text-brand" />
                <div>
                  <h4 className="font-medium text-brand">All systems healthy</h4>
                  <p className="text-brand/80">
                    No product issues detected. All metrics are within acceptable thresholds.
                  </p>
                </div>
              </Alert_Shadcn_>
            ) : (
              <div className="space-y-8">
                {Object.entries(productAdvisories).map(([productKey, product]) => (
                  <div key={productKey} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.items.length > 0 ? (
                          <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                            {product.items.length} issue{product.items.length > 1 ? 's' : ''} found
                          </span>
                        ) : (
                          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            No issues
                          </span>
                        )}
                      </div>
                    </div>

                    {product.items.length > 0 ? (
                      <div className="space-y-3">
                        {product.items.map((item) => (
                          <Alert_Shadcn_ key={item.id} variant={getSeverityColor(item.severity)} className="border-l-4">
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(item.severity)}
                              <div className="flex-1 space-y-2">
                                <div>
                                  <h4 className="font-medium">{item.title.replace(`${product.name}: `, '')}</h4>
                                  <p className="text-sm text-foreground-light">{item.description.replace(`${product.name} `, '').replace(`${product.name}`, 'API')}</p>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Current:</span>
                                    <span>{typeof item.currentValue === 'number' ? item.currentValue.toFixed(1) : item.currentValue}</span>
                                    <span className="text-foreground-light">|</span>
                                    <span className="font-medium">Threshold:</span>
                                    <span>{item.threshold}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Recommendation:</span>
                                    <span className="ml-2 text-foreground-light">{item.recommendation}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Alert_Shadcn_>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground-light italic">
                        All {product.name.toLowerCase()} metrics are within acceptable thresholds.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

ProductAdvisor.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Product Advisory">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default ProductAdvisor