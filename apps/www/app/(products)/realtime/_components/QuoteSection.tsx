import { QuoteSection as SharedQuoteSection } from '../../_shared/QuoteSection'

export function QuoteSection() {
  return (
    <SharedQuoteSection
      quote="Supabase takes out the mental effort from our back-end infrastructure so we can focus on our customers needs."
      author={{
        name: 'Aaron Sullivan',
        role: 'Principal Software Engineer at Epsilon3',
        image: '/images/blog/avatars/aaron-epsilon3.png',
        link: '/customers/epsilon3',
      }}
    />
  )
}
