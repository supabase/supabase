'use client'

import { EdgeFunctionRuntimeLogsPageContent } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionRuntimeLogsPageContent'

import { V2EdgeFunctionRouteShell } from '../V2EdgeFunctionRouteShell'

export default function V2EdgeFunctionLogsPage() {
  return (
    <V2EdgeFunctionRouteShell title="Logs">
      <EdgeFunctionRuntimeLogsPageContent />
    </V2EdgeFunctionRouteShell>
  )
}
