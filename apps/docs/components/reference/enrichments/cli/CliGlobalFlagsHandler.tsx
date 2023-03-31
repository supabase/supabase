import RefSubLayout from '~/layouts/ref/RefSubLayout'

// @ts-expect-error
import spec from '~/../../spec/cli_v1_commands.yaml' assert { type: 'yaml' }
import Param from '~/components/Params'
import Options from '~/components/Options'

const CliGlobalFlagsHandler = () => {
  return (
    <RefSubLayout.EducationRow className="not-prose">
      <RefSubLayout.Details>
        <h3 className="text-lg text-scale-1200 mb-3">Flags</h3>
        <ul className="">
          {spec.flags.map((flag) => {
            return (
              <Param
                {...flag}
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
