'use client'

import { EdgeFunctionCodePageContent } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionCodePageContent'

import { V2EdgeFunctionRouteShell } from '../V2EdgeFunctionRouteShell'

export default function V2EdgeFunctionCodePage() {
  return (
    <V2EdgeFunctionRouteShell title="Code">
      <EdgeFunctionCodePageContent />
    </V2EdgeFunctionRouteShell>
  )
}
