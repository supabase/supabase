import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Button,
} from 'ui'

interface OptInToOpenAIToggleProps {
  className?: string
}
export default function OptInToOpenAIToggle({ className }: OptInToOpenAIToggleProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="text"
          className="text-brand border-b p-0 hover:bg-transparent hover:text-foreground text-sm"
        >
          Learn more about data privacy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader padding="small" className="border-b">
          <DialogTitle>Where does my data go?</DialogTitle>
        </DialogHeader>
        <DialogSection className="space-y-4 text-sm text-foreground-light" padding="small">
          <p>
            Supabase AI is a chatbot support tool powered by OpenAI. Supabase will share the query
            you submit and information about the databases you manage through Supabase with OpenAI,
            L.L.C. and its affiliates in order to provide the Supabase AI tool.
          </p>
          <p>
            OpenAI will only access information about the structure of your databases, such as table
            names, column and row headings. OpenAI will not access the contents of the database
            itself.
          </p>
          <p>
            OpenAI uses this information to generate responses to your query, and does not retain or
            use the information to train its algorithms or otherwise improve its products and
            services.
          </p>
          <p>
            If you have your own individual account on Supabase, we will use any personal
            information collected through [Supabase AI] to provide you with the [Supabase AI] tool.
            If you are in the UK, EEA or Switzerland, the processing of this personal information is
            necessary for the performance of a contract between you and us.
          </p>
          <p>
            Supabase collects information about the queries you submit through Supabase AI and the
            responses you receive to assess the performance of the Supabase AI tool and improve our
            services. If you are in the UK, EEA or Switzerland, the processing is necessary for our
            legitimate interests, namely informing our product development and improvement.
          </p>
          <p>
            For more information about how we use personal information, please see our{' '}
            <Link
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:text-foreground"
            >
              privacy policy
            </Link>
            .
          </p>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
