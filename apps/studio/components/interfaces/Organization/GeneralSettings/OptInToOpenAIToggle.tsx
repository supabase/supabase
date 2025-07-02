import { InlineLink } from 'components/ui/InlineLink'
import { useFlag } from 'hooks/ui/useFlag'

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
  const useBedrockAssistant = useFlag('useBedrockAssistant')

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
          {useBedrockAssistant ? (
            <>
              <p>
                Supabase AI utilizes Amazon Bedrock ("Bedrock"), a service designed with a strong
                focus on data privacy and security.
              </p>

              <p>
                Amazon Bedrock does not store or log your prompts and completions. This data is not
                used to train any AWS models and is not distributed to third parties or model
                providers. Model providers do not have access to Amazon Bedrock logs or customer
                prompts and completions.
              </p>

              <p>
                By default, no information is shared with Bedrock unless you explicitly provide
                consent. With your permission, Supabase may share customer-generated prompts,
                database schema, database data, and project logs with Bedrock. This information is
                used solely to generate responses to your queries and is not retained by Bedrock or
                used to train their foundation models.
              </p>

              <p>
                If you are a HIPAA Covered Entity, please note that Bedrock is HIPAA eligible, and
                Supabase has a Business Associate Agreement in place covering this use.
              </p>

              <p>
                For more detailed information about how we collect and use your data, see our{' '}
                <InlineLink href="https://supabase.com/privacy">Privacy Policy</InlineLink>. You can
                choose which types of information you consent to share by selecting from the options
                in the AI settings.
              </p>
            </>
          ) : (
            <>
              <p>
                Supabase AI is a chatbot support tool powered by OpenAI. Supabase will share the
                query you submit and information about the databases you manage through Supabase
                with OpenAI, L.L.C. and its affiliates in order to provide the Supabase AI tool.
              </p>

              <p>
                OpenAI will only access information about the structure of your databases, such as
                table names, column and row headings. OpenAI will not access the contents of the
                database itself.
              </p>

              <p>
                OpenAI uses this information to generate responses to your query, and does not
                retain or use the information to train its algorithms or otherwise improve its
                products and services.
              </p>

              <p>
                If you have your own individual account on Supabase, we will use any personal
                information collected through [Supabase AI] to provide you with the [Supabase AI]
                tool. If you are in the UK, EEA or Switzerland, the processing of this personal
                information is necessary for the performance of a contract between you and us.
              </p>

              <p>
                Supabase collects information about the queries you submit through Supabase AI and
                the responses you receive to assess the performance of the Supabase AI tool and
                improve our services. If you are in the UK, EEA or Switzerland, the processing is
                necessary for our legitimate interests, namely informing our product development and
                improvement.
              </p>

              <p>
                For more information about how we use personal information, please see our{' '}
                <InlineLink href="https://supabase.com/privacy">privacy policy</InlineLink>.
              </p>
            </>
          )}
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
