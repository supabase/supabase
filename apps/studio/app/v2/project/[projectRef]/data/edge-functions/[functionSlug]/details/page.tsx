'use client'

import { EdgeFunctionDetails } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails'

import { V2EdgeFunctionRouteShell } from '../V2EdgeFunctionRouteShell'

export default function V2EdgeFunctionSettingsPage() {
  return (
    <V2EdgeFunctionRouteShell title="Settings">
      <EdgeFunctionDetails />
    </V2EdgeFunctionRouteShell>
  )
}
