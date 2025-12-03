import DefaultLayout from '~/components/Layouts/Default'
import { motion } from 'framer-motion'
import { HighlightedText } from '~/components/Wrapped/HighlightedText'

export default function SupabaseWrappedPage() {
  return (
    <DefaultLayout className="bg-alternative">
      <section className="max-w-[60rem] aspect-[4/3] mx-auto border-x px-8">
        <div className="flex flex-col gap-16">
          <h1 className="font-bold tracking-tight text-[6rem]">
            Supabase <HighlightedText>Wrapped</HighlightedText>
          </h1>
        </div>
      </section>
    </DefaultLayout>
  )
}
