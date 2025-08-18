import type { Metadata } from 'next'
import CustomersClient from './CustomersClient'
import { getSortedPosts } from 'lib/posts'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Customer Stories | Supabase',
  description:
    'See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work.',
  openGraph: {
    title: 'Customer Stories | Supabase',
    description:
      'See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work.',
    images: [{ url: 'https://supabase.com/images/customers/og/customer-stories.jpg' }],
  },
}

export default async function CustomersPage() {
  const allPostsData: any[] = getSortedPosts({ directory: '_customers' })

  const industries = allPostsData.reduce<{ [key: string]: number }>(
    (acc, customer) => {
      acc.all = (acc.all || 0) + 1
      customer.industry?.forEach((industry: string) => {
        acc[industry] = (acc[industry] || 0) + 1
      })
      return acc
    },
    { all: 0 }
  )

  const products = allPostsData.reduce<{ [key: string]: number }>(
    (acc, customer) => {
      acc.all = (acc.all || 0) + 1
      customer.supabase_products?.forEach((product: string) => {
        acc[product] = (acc[product] || 0) + 1
      })
      return acc
    },
    { all: 0 }
  )

  return <CustomersClient blogs={allPostsData as any} industries={industries} products={products} />
}
