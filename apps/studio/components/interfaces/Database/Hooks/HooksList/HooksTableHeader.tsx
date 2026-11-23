import { TableHead, TableHeader, TableRow } from 'ui'

export const HooksTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead key="name" className="w-[20%]">
          <p className="translate-x-[36px]">Name</p>
        </TableHead>
        <TableHead key="table" className="w-[15%] hidden lg:table-cell">
          Table
        </TableHead>
        <TableHead key="events" className="w-[24%] hidden xl:table-cell">
          Events
        </TableHead>
        <TableHead key="webhook" className="hidden xl:table-cell">
          Webhook
        </TableHead>
        <TableHead key="buttons" className="w-[5%]"></TableHead>
      </TableRow>
    </TableHeader>
  )
}
