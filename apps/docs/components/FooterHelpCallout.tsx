import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

export type FooterHelpCalloutType = 'default' | 'postgres'

const content = {
  default: {
    title: 'Need some help?',
    description: `Not to worry, our specialist engineers are here to help. Submit a support ticket through the [Dashboard](https://supabase.com/dashboard/support/new).`,
  },
  postgres: {
    title: 'Looking for Serverless Postgres?',
    description: `Supabase is the fastest way to get started with Postgres in a serverless environment. [Learn more](https://supabase.com/database?utm=postgres-helpers).`,
  },
}

const FooterHelpCallout = ({
  footerHelpType = 'default',
  title,
}: {
  footerHelpType: FooterHelpCalloutType
  title: any
}) => {
  return (
    <div className="mt-32 prose prose--remove-p-margin max-w-none">
      <div
        className="
        min-w-full 
        px-8 py-6 
        bg-background
        rounded 
        text-sm text-foreground-muted
      "
      >
        <h5 className="text-sm text-foreground-light m-0">{content[footerHelpType].title}</h5>
        <ReactMarkdown>{content[footerHelpType].description}</ReactMarkdown>
      </div>
    </div>
  )
}

export default FooterHelpCallout
