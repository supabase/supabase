'use client'

import DefaultLayout from '~/components/Layouts/Default'
import { Home } from '~/components/Wrapped/Pages/Home'
import { Intro } from '~/components/Wrapped/Pages/Intro'
import { YearOfAI } from '~/components/Wrapped/Pages/YearOfAI'
import { Devs } from '~/components/Wrapped/Pages/Devs'
import { SupabaseSelect } from '~/components/Wrapped/Pages/SupabaseSelect'
import { CustomerStories } from '~/components/Wrapped/Pages/CustomerStories'
import { ProductAnnouncements } from '~/components/Wrapped/Pages/ProductAnnouncements'
import ProductsCta from '~/components/Sections/ProductsCta2'

export default function WrappedClient() {
  return (
    <DefaultLayout className="bg-alternative relative">
      <Home />
      <Intro />
      <YearOfAI />
      <Devs />
      <ProductAnnouncements />
      <SupabaseSelect />
      <CustomerStories />
      <ProductsCta
        currentProduct="functions"
        className="max-w-[60rem] mx-auto px-6 w-full !py-24 xl:!gap-24 lg:!py-44"
      />
    </DefaultLayout>
  )
}
