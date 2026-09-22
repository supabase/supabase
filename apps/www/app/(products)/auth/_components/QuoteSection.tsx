import { QuoteSection as SharedQuoteSection } from '../../_shared/QuoteSection'

export function QuoteSection() {
  return (
    <SharedQuoteSection
      quote="Supabase is not only super easy to get started, but also provides all the backend solutions we require as we continue to grow."
      highlight="The auth system just works out of the box."
      author={{
        name: 'Alfred Lua',
        role: 'Cofounder of Pebblely',
        image: '/images/blog/avatars/alfred-lua-pebblely.jpeg',
        link: '/customers/pebblely',
      }}
    />
  )
}
