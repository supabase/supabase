'use client'

import { useForceDeepDark } from 'lib/theme.utils'

import DefaultLayout from '@/components/Layouts/Default'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  useForceDeepDark()

  return <DefaultLayout>{children}</DefaultLayout>
}
