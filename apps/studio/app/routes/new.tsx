import { Outlet } from '@remix-run/react'
import WizardLayout from 'components/layouts/WizardLayout'

export default function New() {
  return (
    <WizardLayout>
      <Outlet />
    </WizardLayout>
  )
}
