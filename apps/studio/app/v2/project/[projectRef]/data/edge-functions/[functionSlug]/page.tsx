'use client'

import { EdgeFunctionOverviewPageContent } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionOverviewPageContent'

import { V2EdgeFunctionRouteShell } from './V2EdgeFunctionRouteShell'

export default function V2EdgeFunctionDetailPage() {
  return (
    <V2EdgeFunctionRouteShell title="Overview">
      <EdgeFunctionOverviewPageContent />
    </V2EdgeFunctionRouteShell>
  )
}
