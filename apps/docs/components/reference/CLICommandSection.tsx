// @ts-expect-error
import { IconChevronRight } from '~/../../packages/ui'
import spec from '~/../../spec/cli_v1_commands.yaml' assert { type: 'yml' }
import CodeBlock from '~/components/CodeBlock/CodeBlock'
import Options from '~/components/Options'
import Param from '~/components/Params'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

interface ICommonFunc {
  id: string
  title: string
  slug: string
  product: string
  libs: string
  items: ICommonFunc[]
}

interface IRefFunctionSection {
  funcData: any
  commonFuncData: ICommonFunc
  spec: any
}

export type Flag = {
  id: string
  name: string
  description: string
  default_value: string
  accepted_values: AcceptedValue[]
}

export type AcceptedValue = {
  id: string
  name: string
  type: 'string' | 'boolean' | 'object'
  description?: string
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

const CliCommandSection = (props) => {
  const command = spec.commands.find((x: any) => x.id === props.funcData.id)

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
              <div className="mb-3">
                <h3 className="text-lg text-scale-1200 mb-3">Available Commands</h3>
                <ul>
                  {command.subcommands.map((subcommand) => (
                    <li key={subcommand} className="flex items-center gap-3">
                      <div className="text-scale-900">
                        <IconChevronRight size={14} strokeWidth={2} />
                      </div>
                      <a
                        href={`#${subcommand}`}
                        className="transition text-scale-1100 hover:text-brand-900"
                      >
                        $ {subcommand.replace(/-/g, ' ')}
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
}

export default CliCommandSection
