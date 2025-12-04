'use client'

import DefaultLayout from '~/components/Layouts/Default'
import { Home } from '~/components/Wrapped/Pages/Home'
import { Intro } from '~/components/Wrapped/Pages/Intro'
import { YearOfAI } from '~/components/Wrapped/Pages/YearOfAI'
import { Devs } from '~/components/Wrapped/Pages/Devs'
import { SupabaseSelect } from '~/components/Wrapped/Pages/SupabaseSelect'
import { CustomerStories } from '~/components/Wrapped/Pages/CustomerStories'
import { ProductAnnouncements } from '~/components/Wrapped/Pages/ProductAnnouncements'

export default function SupabaseWrappedPage() {
  return (
    <DefaultLayout className="bg-alternative relative">
      <Home />
      <Intro />
      <YearOfAI />
      <Devs />
      <ProductAnnouncements />
      <SupabaseSelect />
      <CustomerStories />
    </DefaultLayout>
  )
}
