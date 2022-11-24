// @ts-expect-error
import cliSpec from '~/../../spec/cli_v1_commands_new_shape.yaml' assert { type: 'yml' }
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

export type AcceptedValue = {
  id: string
  name: string
  type: 'string' | 'boolean' | 'object'
  description?: string
}

export type Flag = {
  id: string
  name: string
  description: string
  default_value: string
  accepted_values: AcceptedValue[]
}

export type Command = {
  id: string
  title: string
  description: string
  flags?: Flag[]
  summary: string
  tags?: []
  links?: []
  subcommands?: []
  usage?: string
}

export default function CliUsage() {
  return (
    <RefSubLayout>
      <div className="flex my-16">
        <div className="w-full">
          <div className="grid gap-16">
            <h1 className="text-4xl">{cliSpec.info.title}</h1>
            <p className="">{cliSpec.info.description}</p>
          </div>

          <div className="grid gap-32 mx-auto max-w-5xl mt-24">
            {cliSpec.commands.map((command: Command, commandIndex) => {
              return (
                <RefSubLayout.Section title={'$ ' + command.title} id={command.id} monoFont={true}>
                  <RefSubLayout.Details>
                    <div className="grid ref-container" id={command.id}>
                      <div className="border-b pb-8" key={command.id}>
                        <header
                          className={[
                            // 'border-b sticky top-16 z-10',
                            ' mb-16',
                          ].join(' ')}
                        >
                          <p className="capitalize mb-4 scroll-mt-16 mt-0 text-scale-1100 text-base">
                            {command.summary}
                          </p>
                        </header>

                        {/* {command.usage && (
                          <CodeBlock language="bash" className="relative">
                            {command.usage}
                          </CodeBlock>
                        )} */}

                        {command.subcommands.length > 0 && (
                          <div className="">
                            <h3 className="text-sm font-bold text-scale-1200 mb-3">
                              Available Commands
                            </h3>
                            <ul>
                              {command.subcommands.map((subcommand) => (
                                <li key={subcommand}>
                                  <a href={`#${subcommand}`}>
                                    <CodeBlock language="bash">{subcommand}</CodeBlock>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {command.flags.length > 0 && (
                          <>
                            <h3 className="text-lg text-scale-1200 mb-3">Flags</h3>
                            <ul className="">
                              {command.flags.map((flag: Flag) => (
                                <>
                                  <li className="mt-0">
                                    <Param {...flag}>
                                      {flag?.accepted_values && (
                                        <Options>
                                          {flag?.accepted_values.map((value) => {
                                            return <Options.Option {...value} />
                                          })}
                                        </Options>
                                      )}
                                    </Param>
                                  </li>
                                </>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </RefSubLayout.Details>
                  <RefSubLayout.Examples>
                    {command.usage && (
                      <CodeBlock language="bash" className="relative">
                        {command.usage}
                      </CodeBlock>
                    )}
                  </RefSubLayout.Examples>
                </RefSubLayout.Section>
              )
            })}
          </div>
        </div>
      </div>
    </RefSubLayout>
  )
}
