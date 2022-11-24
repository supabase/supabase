// @ts-expect-error
import cliSpec from '~/../../spec/cli_v1_commands_new_shape.yaml' assert { type: 'yml' }
import CodeBlock from '~/components/CodeBlock/CodeBlock'

type Flag = {
  id: string
  name: string
  description: string
  default_value: string
}

type Command = {
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
    <article>
      <div className="flex my-16">
        <div className="w-full">
          <h1>Usage</h1>
          <div className="max-w-xs w-32 h-[1px] bg-gradient-to-r from-brand-800 to-brand-900 my-4"></div>
          <p className="text-xl max-w-xl">{cliSpec.info.description}</p>

          <div className="grid gap-32 mx-auto max-w-5xl mt-24">
            {cliSpec.commands.map((command: Command, commandIndex) => {
              return (
                <div>
                  <div className="grid ref-container" id={command.id}>
                    <div className="prose border-b pb-8" key={command.id}>
                      <header
                        className={[
                          // 'border-b sticky top-16 z-10',
                          ' mb-16',
                        ].join(' ')}
                      >
                        <h2 className="text-2xl not-prose text-scale-1200 capitalize mb-4 scroll-mt-16 mt-0">
                          {command.summary}
                        </h2>
                      </header>

                      {command.usage && (
                        <CodeBlock language="bash" className="relative">
                          {command.usage}
                        </CodeBlock>
                      )}

                      {command.subcommands.length > 0 && (
                        <>
                          <h3 className="text-md font-bold">Available Commands</h3>
                          <ul>
                            {command.subcommands.map((subcommand) => (
                              <li key={subcommand}>
                                <a href={`#${subcommand}`}>
                                  <CodeBlock language="bash">{subcommand}</CodeBlock>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {command.flags.length > 0 && (
                        <>
                          <h3 className="text-lg ">Options</h3>
                          <ul className="grid gap-2">
                            {command.flags.map((flag) => (
                              <li className="mt-0">
                                <div>
                                  <code className="font-bold">{flag.name}</code>
                                </div>
                                <p className="text-sm">{flag.description}</p>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </article>
  )
}
