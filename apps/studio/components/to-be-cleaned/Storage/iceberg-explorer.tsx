import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  convertKVStringArrayToJson,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { Bucket } from 'data/storage/buckets-query'
import { SquareArrowOutUpRight } from 'lucide-react'
import { useMemo } from 'react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, Button, Card } from 'ui'
import { DecryptedReadOnlyInput } from './decrypted-read-only-input'

export const IcebergExplorer = ({ bucket }: { bucket: Bucket }) => {
  const { project } = useProjectContext()

  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrapper = useMemo(() => {
    return data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          {
            handlerName: WRAPPER_HANDLERS.ICEBERG,
            server: {
              options: [],
            },
          },
          wrapper
        )
      )
      .find((w) => w.name === 'iceberg_wrapper')
  }, [data])

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper')

  if (!wrapper) {
    return <div>No wrapper found</div>
  }

  if (!integration || integration.type !== 'wrapper') {
    return <div>No integration found</div>
  }

  const values = convertKVStringArrayToJson(wrapper?.server_options ?? [])
  const wrapperMeta = integration.meta

  return (
    <div className="flex flex-col w-full">
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>
            Iceberg Bucket <span className="text-brand">{bucket.name}</span>
          </ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-4" bottomPadding>
        <Alert_Shadcn_ className="p-10">
          <AlertTitle_Shadcn_ className="flex flex-col">
            <div className="flex flex-row justify-between items-center">
              <div className="col-span-2 space-y-1">
                <p className="block">You're all set!</p>
                <p className="text-sm opacity-50">
                  A wrapper has been setup for this bucket. You can use the Table Editor or SQL
                  Editor to view the tables.
                </p>
              </div>
              <div className="flex items-end justify-end gap-2">
                <Button type="default" icon={<SquareArrowOutUpRight />}>
                  Table Editor
                </Button>
                <Button type="default" icon={<SquareArrowOutUpRight />}>
                  SQL Editor
                </Button>
              </div>
            </div>
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>

        <div>
          <ScaffoldSectionTitle>Connection Details for 3rd Party Clients</ScaffoldSectionTitle>
          <ScaffoldSectionDescription className="mb-4">
            Authenticate your users through a suite of providers and login methods
          </ScaffoldSectionDescription>
          <Card className="flex flex-col gap-6 p-6">
            {wrapperMeta.server.options
              .filter((option) => !option.hidden && values[option.name])
              .map((option) => {
                return (
                  <DecryptedReadOnlyInput
                    key={option.name}
                    label={option.label}
                    secretName={`${wrapper.name}_${option.name}`}
                    value={values[option.name]}
                    secureEntry={option.secureEntry}
                    descriptionText="Used to decode your JWTs. You can also use this to mint your own JWTs."
                  />
                )
              })}
          </Card>
        </div>
      </ScaffoldContainer>
    </div>
  )
}
