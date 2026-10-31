import { QuoteSection as SharedQuoteSection } from '../../_shared/QuoteSection'

export function QuoteSection() {
  return (
    <SharedQuoteSection
      quote="Supabase is great because it has everything. I don't need a different solution for authentication, a different solution for database, or a different solution for storage."
      author={{
        name: 'Yasser Elsaid',
        role: 'Founder of Chatbase',
        image: '/images/blog/avatars/yasser-elsaid-chatbase.jpeg',
        link: '/customers/chatbase',
      }}
    />
  )
}
