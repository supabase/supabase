import RefSubLayout from '~/layouts/ref/RefSubLayout'

import spec from '~/spec/cli_v1_commands.yaml' assert { type: 'yaml' }
import Param from '~/components/Params'

const CliGlobalFlagsHandler = () => {
  return (
    <RefSubLayout.EducationRow className="not-prose">
      <RefSubLayout.Details>
        <h3 className="text-lg text-foreground mb-3">Flags</h3>
        <ul>
          {spec.flags.map((flag) => {
            return (
              <Param
                {...flag}
                key={flag.id}
                id={`${spec.id}-${flag.id}`}
                isOptional={flag.required === undefined ? true : !flag.required}
              ></Param>
            )
          })}
        </ul>
      </RefSubLayout.Details>

      <RefSubLayout.Examples></RefSubLayout.Examples>
    </RefSubLayout.EducationRow>
  )
}

export default CliGlobalFlagsHandler
