import { InlineLink } from 'components/ui/InlineLink'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
} from 'ui'

export const OptInToOpenAIToggle = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="outline" className="w-fit">
          Learn more about data privacy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader padding="small" className="border-b">
          <DialogTitle>Data Privacy and Supabase AI</DialogTitle>
        </DialogHeader>
        <DialogSection
          padding="small"
          className="flex flex-col gap-y-4 text-sm text-foreground-light"
        >
          <p>
            Supabase AI utilizes Amazon Bedrock ("Bedrock"), a service designed with a strong focus
            on data privacy and security.
          </p>

          <p>
            Amazon Bedrock does not store or log your prompts and completions. This data is not used
            to train any AWS models and is not distributed to third parties or model providers.
            Model providers do not have access to Amazon Bedrock logs or customer prompts and
            completions.
          </p>

          <p>
            By default, no information is shared with Bedrock unless you explicitly provide consent.
            With your permission, Supabase may share customer-generated prompts, database schema,
            database data, and project logs with Bedrock. This information is used solely to
            generate responses to your queries and is not retained by Bedrock or used to train their
            foundation models.
          </p>

          <p>
            If you are a HIPAA Covered Entity, please note that Bedrock is HIPAA eligible, and
            Supabase has a Business Associate Agreement in place covering this use.
          </p>

          <p>
            For more detailed information about how we collect and use your data, see our{' '}
            <InlineLink href="https://supabase.com/privacy">Privacy Policy</InlineLink>. You can
            choose which types of information you consent to share by selecting from the options in
            the AI settings.
          </p>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
