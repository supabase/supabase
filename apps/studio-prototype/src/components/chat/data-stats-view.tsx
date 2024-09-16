'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  Card_Shadcn_ as Card,
  CardHeader_Shadcn_ as CardHeader,
  CardTitle_Shadcn_ as CardTitle,
  CardContent_Shadcn_ as CardContent,
} from 'ui'

interface DatabaseStats {
  totalTables: number
  totalRows: number
  databaseSize: string
  lastBackup: string
}

const fetchDatabaseStats = async (type: 'postgres' | 'mysql'): Promise<DatabaseStats> => {
  // This is a mock API call. Replace with actual API call to fetch database stats
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalTables: 25,
        totalRows: 1000000,
        databaseSize: '2.5 GB',
        lastBackup: '2023-06-15 14:30:00',
      })
    }, 1000)
  })
}

export const DatabaseStatsView = ({ type }: { type: 'postgres' | 'mysql' }) => {
  const [data, setData] = React.useState<DatabaseStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isError, setIsError] = React.useState(false)

  React.useEffect(() => {
    fetchDatabaseStats(type)
      .then((stats) => {
        setData(stats)
        setIsLoading(false)
      })
      .catch(() => {
        setIsError(true)
        setIsLoading(false)
      })
  }, [type])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <AlertTitle_Shadcn_>Error</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>Failed to fetch database statistics.</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data?.totalTables}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data?.totalRows.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Database Size</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data?.databaseSize}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Last Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data?.lastBackup}</p>
        </CardContent>
      </Card>
    </div>
  )
}
