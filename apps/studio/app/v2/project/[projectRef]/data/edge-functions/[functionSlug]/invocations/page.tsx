'use client'

import { EdgeFunctionInvocationsPageContent } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionInvocationsPageContent'

import { V2EdgeFunctionRouteShell } from '../V2EdgeFunctionRouteShell'

export default function V2EdgeFunctionInvocationsPage() {
  return (
    <V2EdgeFunctionRouteShell title="Invocations">
      <EdgeFunctionInvocationsPageContent />
    </V2EdgeFunctionRouteShell>
  )
}
