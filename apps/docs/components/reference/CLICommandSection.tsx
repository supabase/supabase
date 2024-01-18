import ReactMarkdown from 'react-markdown'
import { CodeBlock, IconChevronRight, Tabs } from 'ui'
import spec from '~/spec/cli_v1_commands.yaml' assert { type: 'yml' }
import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import RefDetailCollapse from './RefDetailCollapse'

export type Flag = {
  id: string
  name: string
  description: string
  default_value: string
  accepted_values: AcceptedValue[]
  required?: boolean
  /** Whether subcommands inherit this flag. */
  inherit?: boolean
}

export type AcceptedValue = {
  id: string
  name: string
  type: 'string' | 'boolean' | 'object'
  description?: string
}

export type Example = {
  id: string
  name: string
  code: string
  response: string
  description?: string
}

export type Command = {
  id: string
  title: string
  description: string
  flags?: Flag[]
  summary: string
  tags?: string[]
  links?: string[]
  subcommands?: string[]
  usage?: string
  examples?: Example[]
}

const CliCommandSection = (props) => {
  const command = spec.commands.find((x: any) => x.id === props.funcData.id)
  const parentCommand = spec.commands.find(
    (x: any) => x.subcommands && x.subcommands.find((y: any) => y === props.funcData.id)
  )

  const commandFlags = [
    ...(parentCommand?.flags?.filter((x: any) => x.inherit) || []),
    ...command.flags,
  ]

  return (
    <RefSubLayout.Section
      key={command.id}
      slug={command.id}
      title={'$ ' + command.title}
      id={command.id}
      monoFont={true}
      scrollSpyHeader={true}
    >
      <RefSubLayout.Details>
        <div className="grid ref-container" id={command.id}>
          <div className="border-b pb-8" key={command.id}>
            <header
              className={[
                // 'border-b sticky top-16 z-10',
                ' mb-16',
              ].join(' ')}
            >
              {command.description ? (
                <div className="prose">
                  <ReactMarkdown>{command.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="capitalize mb-4 scroll-mt-16 mt-0 text-foreground-light text-base">
                  {command.summary}
                </p>
              )}
            </header>

            {command.subcommands?.length > 0 && (
              <div className="mb-3">
                <h3 className="text-lg text-foreground mb-3">Available Commands</h3>
                <ul>
                  {command.subcommands.map((subcommand) => (
                    <li key={subcommand} className="flex items-center gap-3">
                      <div className="text-foreground-muted">
                        <IconChevronRight size={14} strokeWidth={2} />
                      </div>
                      <a
                        href={`#${subcommand}`}
                        className="transition text-foreground-light hover:text-brand"
                      >
                        $ {subcommand.replace(/-/g, ' ')}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {commandFlags.length > 0 && (
              <>
                <h3 className="text-lg text-foreground mb-3">Flags</h3>
                <ul>
                  {commandFlags.map((flag: Flag) => (
                    <li key={flag.id} className="mt-0">
                      <Param {...flag} isOptional={!flag.required}>
                        {flag?.accepted_values && (
                          <Options>
                            {flag?.accepted_values.map((value) => {
                              return <Options.Option key={value.id} {...value} />
                            })}
                          </Options>
                        )}
                      </Param>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </RefSubLayout.Details>
      {(command.examples || command.usage) && (
        <RefSubLayout.Examples>
          <div className="overflow-hidden w-full">
            <Tabs
              defaultActiveId={`${command.id}-basic-usage`}
              size="tiny"
              type="rounded-pills"
              scrollable
              queryGroup="example"
            >
              {command.examples ? (
                command.examples.map((example) => {
                  const exampleId = `${command.id}-${example.id}`
                  return (
                    <Tabs.Panel
                      id={exampleId}
                      key={exampleId}
                      label={example.name}
                      className="flex flex-col gap-3"
                    >
                      <CodeBlock
                        className="useless-code-block-class"
                        language="bash"
                        hideLineNumbers={true}
                      >
                        {example.code}
                      </CodeBlock>

                      <RefDetailCollapse
                        id={`${exampleId}-response`}
                        label="Response"
                        defaultOpen={false}
                      >
                        <CodeBlock
                          className="useless-code-block-class rounded !rounded-tl-none !rounded-tr-none border border-DEFAULT"
                          language="bash"
                          hideLineNumbers={true}
                        >
                          {example.response}
                        </CodeBlock>
                      </RefDetailCollapse>

                      {example.description && (
                        <RefDetailCollapse
                          id={`${exampleId}-notes`}
                          label="Notes"
                          defaultOpen={false}
                        >
                          <div className="bg-overlay border border-overlay rounded !rounded-tl-none !rounded-tr-none prose max-w-none px-5 py-2">
                            <ReactMarkdown className="text-sm">{example.description}</ReactMarkdown>
                          </div>
                        </RefDetailCollapse>
                      )}
                    </Tabs.Panel>
                  )
                })
              ) : (
                // TODO: remove this block once all commands have examples
                <Tabs.Panel
                  id={`${command.id}-basic-usage`}
                  key={`${command.id}-basic-usage`}
                  label="Basic usage"
                  className="flex flex-col gap-3"
                >
                  <CodeBlock
                    className="useless-code-block-class"
                    language="bash"
                    hideLineNumbers={true}
                  >
                    {command.usage}
                  </CodeBlock>
                </Tabs.Panel>
              )}
            </Tabs>
          </div>
        </RefSubLayout.Examples>
      )}
    </RefSubLayout.Section>
  )
}

export default CliCommandSection
