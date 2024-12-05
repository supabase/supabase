import React, { FC } from 'react'

import { cn, TextLink } from 'ui'
import SectionContainer from '~/components/Layouts/SectionContainer'
import CodeWindow from '~/components/CodeWindow'

const codeSnippet = `const queues = createClient(supabaseUrl, supabaseKey, {
    db: { schema: "pgmq_public" },
  }
);

const send = await queues.rpc("send", {
  queue_name: "subscribers",
  message: { "email": "hello@example.com" }
});


const message = await queues.rpc("pop", {
  queue_name: "subscribers"
});`

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

const QueuesAPISection: FC<Props> = (props) => {
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
      <div className="w-full flex-grow rounded-lg max-w-lg">
        <CodeWindow
          code={codeSnippet}
          lang="js"
          className="
              h-full xl:!text-lg
              [&_.synthax-highlighter]:!pb-8
              [&_.synthax-highlighter]:xl:min-h-[240px]
            "
        />
      </div>
    </SectionContainer>
  )
}

export default QueuesAPISection
