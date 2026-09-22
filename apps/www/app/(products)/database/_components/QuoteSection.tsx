import { QuoteSection as SharedQuoteSection } from '../../_shared/QuoteSection'

export function QuoteSection() {
  return (
    <SharedQuoteSection
      quote="You can have a really great product, but you need to want to work with the people behind it."
      highlight="With Supabase, we always felt very aligned."
      author={{
        name: 'Howard Haynes',
        role: 'CPO at Next Door Lending',
        image: '/images/blog/avatars/howard-haynes.webp',
        link: '/customers/next-door-lending',
      }}
    />
  )
}
