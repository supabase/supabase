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
          <DialogTitle>What do we do with your data?</DialogTitle>
        </DialogHeader>
        <DialogSection className="space-y-4 text-sm text-foreground-light" padding="small">
          <p>
            Supabase AI is a support tool powered by Amazon Bedrock ("Bedrock"). By default, no
            information is shared with Bedrock unless you explicitly provide consent.
          </p>

          <p>
            To improve our services, and only with your permission, we may share customer-generated
            prompts, database schema, database data, and project logs with Bedrock. This information
            is used solely to generate responses to your queries and is not retained or used to
            train their models.
          </p>

          <p>
            If you are a HIPAA Covered Entity, please note that Bedrock is HIPPA eligible and
            Supabase has a Business Associate Agreement in place covering this use.
          </p>

          <p>
            For more detailed information about how we collect and use your data, see our{' '}
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
