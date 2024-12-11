import { Node, Edge } from 'reactflow'

export function getGraphDataFromSchema(schema: any[]) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Position tables in a grid layout
  const GRID_SPACING = 250
  const COLUMNS = 3

  schema.forEach((table, index) => {
    const row = Math.floor(index / COLUMNS)
    const col = index % COLUMNS

    nodes.push({
      id: table.name,
      type: 'table',
      position: { x: col * GRID_SPACING, y: row * GRID_SPACING },
      data: {
        name: table.name,
        columns: table.columns.map((col: any) => ({
          id: `${table.name}.${col.name}`,
          name: col.name,
          type: col.type,
          isPrimary: col.isPrimaryKey,
          isNullable: col.nullable,
          isUnique: col.isUnique,
          isForeign: !!col.foreignKey,
        })),
      },
    })

    // Add edges for foreign key relationships
    table.columns.forEach((column: any) => {
      if (column.foreignKey) {
        edges.push({
          id: `${table.name}.${column.name}->${column.foreignKey.table}.${column.foreignKey.column}`,
          source: table.name,
          target: column.foreignKey.table,
          sourceHandle: `${table.name}.${column.name}`,
          targetHandle: `${column.foreignKey.table}.${column.foreignKey.column}`,
        })
      }
    })
  })

  return { nodes, edges }
}
