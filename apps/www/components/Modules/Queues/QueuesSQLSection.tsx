import React, { FC } from 'react'

import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CodeWindow from '~/components/CodeWindow'

const codeSnippet = `
select pgmq.create('my_special_queue');

select * from pgmq.send(
  queue_name  => 'my_special_queue',
  msg         => '{"hello": "world"}',
);

select * from pgmq.pop('my_special_queue');
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

const QueuesSQLSection: FC<Props> = (props) => {
  return (
    <SectionContainer
      id={props.id}
      className={cn(
        'mx-auto lg:max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8',
        props.className
      )}
    >
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
      <div className="flex order-first md:order-last flex-col gap-2 max-w-md">
        <span className="label">{props.label}</span>
        <h2 className="h2 !m-0">{props.heading}</h2>
        <p className="p !text-foreground-lighter">{props.subheading}</p>
        {props.cta && (
          <TextLink hasChevron label={props.cta.label} url={props.cta.url} className="mt-2" />
        )}
      </div>
    </SectionContainer>
  )
}

export default QueuesSQLSection
