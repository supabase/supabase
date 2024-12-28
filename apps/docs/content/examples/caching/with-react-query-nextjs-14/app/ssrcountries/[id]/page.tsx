import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { prefetchQuery } from '@supabase-cache-helpers/postgrest-react-query'
import useSupabaseServer from '@/utils/supabase-server'
import { cookies } from 'next/headers'
import Country from '../country'
import { getCountryById } from '@/queries/get-country-by-id'

export default async function CountryPage({
  params,
}: {
  params: { id: number }
}) {
  const queryClient = new QueryClient()
  const cookieStore = cookies()
  const supabase = useSupabaseServer(cookieStore)

  await prefetchQuery(queryClient, getCountryById(supabase, params.id))

  return (
    // Neat! Serialization is now as easy as passing props.
    // HydrationBoundary is a Client Component, so hydration will happen there.
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Country id={params.id} />
    </HydrationBoundary>
  )
}
