import Table from 'components/to-be-cleaned/Table'

const HooksListEmpty = () => {
  return (
    <Table
      className="table-fixed"
      head={
        <>
          <Table.th key="name" className="w-[20%]">
            <p className="translate-x-[36px]">Name</p>
          </Table.th>
          <Table.th key="table" className="w-[15%] hidden lg:table-cell">
            Table
          </Table.th>
          <Table.th key="events" className="w-[24%] hidden xl:table-cell">
            Events
          </Table.th>
          <Table.th key="webhook" className="hidden xl:table-cell">
            Webhook
          </Table.th>
          <Table.th key="buttons" className="w-[5%]"></Table.th>
        </>
      }
      body={
        <Table.tr>
          <Table.td colSpan={5}>
            <p className="text-sm text-foreground">No hooks created yet</p>
            <p className="text-sm text-foreground-light">
              Create a new hook by clicking "Create a new hook"
            </p>
          </Table.td>
        </Table.tr>
      }
    />
  )
}

export default HooksListEmpty
