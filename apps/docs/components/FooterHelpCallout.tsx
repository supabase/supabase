import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

export type FooterHelpCalloutType = 'default' | 'postgres'

const content = {
  default: {
    title: 'Need some help?',
    description: `Not to worry, our specialist engineers are here to help. Submit a support ticket through the [Dashboard](https://iechor.com/dashboard/support/new).`,
  },
  postgres: {
    title: 'Looking for Serverless Postgres?',
    description: `iEchor is the fastest way to get started with Postgres in a serverless environment. [Learn more](https://iechor.com/database?utm=postgres-helpers).`,
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
        bg-scale-300 dark:bg-whiteA-200 
        rounded 
        text-sm text-scale-900
      "
      >
        <h5 className="text-sm text-scale-1100 m-0">{content[footerHelpType].title}</h5>
        <ReactMarkdown>{content[footerHelpType].description}</ReactMarkdown>
      </div>
    </div>
  )
}

export default FooterHelpCallout
