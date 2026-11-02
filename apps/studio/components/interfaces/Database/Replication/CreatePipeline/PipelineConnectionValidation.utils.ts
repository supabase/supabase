import * as z from 'zod'

import { BigQueryFormSchema } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.schema'
import { getBigQueryValidationIssues } from '../DestinationPanel/DestinationForm/BigQuery/BigQuery.utils'
import { ClickHouseFormSchema } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.schema'
import { getClickHouseValidationIssues } from '../DestinationPanel/DestinationForm/ClickHouse/ClickHouse.utils'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { DuckLakeFormSchema } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.schema'
import { getDucklakeValidationIssues } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.utils'
import { SnowflakeFormSchema } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.schema'
import { getSnowflakeValidationIssues } from '../DestinationPanel/DestinationForm/Snowflake/Snowflake.utils'

type ConnectionDestination = 'BigQuery' | 'DuckLake' | 'Snowflake' | 'ClickHouse'
const schemas = {
  BigQuery: BigQueryFormSchema.omit({ tableOptions: true }),
  DuckLake: DuckLakeFormSchema,
  Snowflake: SnowflakeFormSchema,
  ClickHouse: ClickHouseFormSchema,
}
const validators = {
  BigQuery: getBigQueryValidationIssues,
  DuckLake: getDucklakeValidationIssues,
  Snowflake: getSnowflakeValidationIssues,
  ClickHouse: getClickHouseValidationIssues,
}

export const getConnectionFieldNames = (type: ConnectionDestination) =>
  ['name', ...Object.keys(schemas[type].shape)].filter(
    (name): name is keyof DestinationPanelSchemaType => name in DestinationPanelFormSchema.shape
  )

export const getConnectionValidationIssues = (
  type: ConnectionDestination,
  data: DestinationPanelSchemaType
) => {
  const result = schemas[type]
    .extend({ name: z.string().trim().min(1, 'Name is required.') })
    .safeParse(data)
  return [
    ...(result.success
      ? []
      : result.error.issues.map((issue) => ({ path: issue.path[0], message: issue.message }))),
    ...validators[type](data),
  ].filter(
    (issue): issue is { path: keyof DestinationPanelSchemaType; message: string } =>
      typeof issue.path === 'string' && issue.path in DestinationPanelFormSchema.shape
  )
}
