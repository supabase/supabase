'use client'

import { useForceDeepDark } from 'lib/theme.utils'
import { usePathname } from 'next/navigation'
import { PRODUCT_NAMES } from 'shared-data/products'

import ProductsNav from '../../components/Products/ProductsNav'
import DefaultLayout from '@/components/Layouts/Default'

const SEGMENT_TO_PRODUCT: Record<string, PRODUCT_NAMES> = {
  database: PRODUCT_NAMES.DATABASE,
  auth: PRODUCT_NAMES.AUTHENTICATION,
  storage: PRODUCT_NAMES.STORAGE,
  'edge-functions': PRODUCT_NAMES.FUNCTIONS,
  realtime: PRODUCT_NAMES.REALTIME,
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  useForceDeepDark()

  const pathname = usePathname()
  const segment = pathname?.split('/')[1] ?? ''
  const activePage = SEGMENT_TO_PRODUCT[segment]

  return (
    <DefaultLayout>
      <ProductsNav activePage={activePage} />
      {children}
    </DefaultLayout>
  )
}
