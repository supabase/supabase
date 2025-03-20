import fs from 'fs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
// import { parse } from 'react-docgen'

export function ComponentProps(props: any) {
  // map through all props types for this component DropdownMenu
  // return a table with the prop name, type, default value, and description

  //   const code = `
  // /** My first component */
  // export default ({ name }: { name: string }) => <div>{{name}}</div>;
  // `

  //   const documentation = parse(code)
  //
  //   console.log(documentation)

  // console.log('from the component props', JSON.parse(props.docs))

  const docs = JSON.parse(props.docs)

  // console.log(docs.props)

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground-light">{props.children}</p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono uppercase text-xs font-normal">Prop Name</TableHead>
            <TableHead className="font-mono uppercase text-xs font-normal">Required</TableHead>
            <TableHead className="font-mono uppercase text-xs font-normal">Type</TableHead>
            <TableHead className="font-mono uppercase text-xs text-right font-normal">
              Description
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(docs.props).map(([propName, prop], index) => (
            <TableRow key={index}>
              <TableCell>{propName}</TableCell>
              {/* 
              // @ts-ignore */}
              <TableCell>{prop.required ? 'Yes' : 'No'}</TableCell>
              {/* 
              // @ts-ignore */}
              <TableCell>{prop.flowType.name}</TableCell>
              {/* 
              // @ts-ignore */}
              <TableCell className="text-right">{prop.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
