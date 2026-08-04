import { type Metadata } from 'next'

import Error404 from '@/components/Error404'

export const metadata: Metadata = {
  title: '404: This page could not be found',
  robots: {
    index: false,
  },
}

export default function NotFound() {
  return <Error404 />
}
