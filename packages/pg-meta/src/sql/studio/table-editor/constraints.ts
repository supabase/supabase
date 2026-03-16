export const getDropConstraintSQL = ({
  schema,
  table,
  name,
}: {
  schema: string
  table: string
  name: string
}) => `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${name}"`
