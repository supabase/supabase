import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Plus } from 'lucide-react'
import Table from 'components/to-be-cleaned/Table'

export const ReplicationPublications = () => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Publications"></FormHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ButtonTooltip
                  className="ml-auto"
                  icon={<Plus />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: 'Create a publication',
                    },
                  }}
                >
                  New Publication
                </ButtonTooltip>
              </div>
              <div className="my-4 w-full">
                <Table
                  head={[
                    <Table.th key="icon" className="!px-0" />,
                    <Table.th key="name">Name</Table.th>,
                    <Table.th key="tables" className="hidden xl:table-cell">
                      Num Tables
                    </Table.th>,
                    <Table.th key="buttons">Edit</Table.th>,
                  ]}
                  body={<div>No publications</div>}
                ></Table>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
