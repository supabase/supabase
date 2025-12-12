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
            Supabase AI utilizes third-party AI providers designed with a strong focus on data
            privacy and security.
          </p>

          <p>
            By default, only schema data is shared with third-party AI providers. This is not
            retained by them nor used as training data. With your permission, Supabase may also
            share customer-generated prompts, database data, and project logs with these providers.
            This information is used solely to generate responses to your queries and is not
            retained by the providers or used to train their models.
          </p>

          <p>
            For organizations with HIPAA compliance enabled in their Supabase configuration, any
            consented information will only be shared with third-party AI providers with whom
            Supabase has established a Business Associate Agreement (BAA).
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
