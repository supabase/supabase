import React, { FC } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CodeWindow from '~/components/CodeWindow'

const codeSnippet = `
select
  cron.schedule(
    'call-hello-world-every-5-minutes',
    '*/5 * * * *',
    'select hello_world()'
  );
`
interface Props {
  id: string
  label: string | JSX.Element
  heading: string | JSX.Element
  subheading: string | JSX.Element
  className?: string
  cta?: {
    label: string
    url: string
  }
}

const CronSQLSection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn(
        'mx-auto lg:max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8',
        props.className
      )}
    >
      <div className="flex flex-col gap-2 max-w-md">
        <span className="label">{props.label}</span>
        <h2 className="h2 !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter">{props.subheading}</p>
        {props.cta && (
          <TextLink hasChevron label={props.cta.label} url={props.cta.url} className="mt-2" />
        )}
      </div>
      <ul className="w-full flex-grow rounded-lg max-w-md">
        <div className="w-full h-full relative">
          <CodeWindow
            code={codeSnippet}
            lang="sql"
            className="
              h-full xl:!text-lg
              [&_.synthax-highlighter]:!pb-8
              [&_.synthax-highlighter]:xl:min-h-[240px]
            "
          />
        </div>
      </ul>
    </SectionContainer>
  )
}

export default CronSQLSection
