import { observer } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import FunctionsListItem from 'components/interfaces/Functions/FunctionsListItem'
import { Function } from 'components/interfaces/Functions/Functions.types'
import FunctionsEmptyState from 'components/interfaces/Functions/FunctionsEmptyState'
import TerminalInstructions from 'components/interfaces/Functions/TerminalInstructions'

const FunctionsList = ({ functions }: { functions: Function[] }) => {
  return (
    <>
      <div className="flex flex-col gap-3 py-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-scale-900">{`${functions.length} function${
            functions.length > 1 ? 's' : ''
          } deployed`}</span>
        </div>
        <div>
          <Table
            head={
              <>
                <Table.th>Name</Table.th>
                <Table.th>URL</Table.th>
                <Table.th className="hidden lg:table-cell">Created</Table.th>
                <Table.th className="hidden 2xl:table-cell">Last updated</Table.th>
                <Table.th className="hidden 2xl:table-cell">Version</Table.th>
                <Table.th className="text-right">Status</Table.th>
              </>
            }
            body={
              <>
                {functions.length > 0 &&
                  functions.map((item: any) => <FunctionsListItem key={item.id} function={item} />)}
              </>
            }
          />
        </div>
      </div>
    </>
  )
}

const PageLayout: NextPageWithLayout = () => {
  const { functions } = useStore()
  const hasFunctions = functions.list().length > 0

  return hasFunctions ? (
    <div className="py-6">
      <TerminalInstructions closable />
      <FunctionsList functions={functions.list()} />
    </div>
  ) : (
    <FunctionsEmptyState />
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
