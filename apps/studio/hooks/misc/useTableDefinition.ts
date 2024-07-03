import { useViewDefinitionQuery } from '../../data/database/view-definition-query'
import { useTableDefinitionQuery } from '../../data/database/table-definition-query'
import { format } from 'sql-formatter'
import { Project } from 'data/projects/project-detail-query'
import { EntityType } from 'data/entity-types/entity-type-query'
import { ENTITY_TYPE } from '../../data/entity-types/entity-type-constants'

function useTableDefinition(entityType: EntityType | undefined, project: Project | undefined) {
  const viewResult = useViewDefinitionQuery(
    {
      schema: entityType?.schema,
      name: entityType?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled:
        entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW,
    }
  )

  const tableResult = useTableDefinitionQuery(
    {
      schema: entityType?.schema,
      name: entityType?.name,
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: entityType?.type === ENTITY_TYPE.TABLE,
    }
  )

  const { data: definition, isLoading } =
    entityType?.type === ENTITY_TYPE.VIEW || entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
      ? viewResult
      : tableResult

  const prepend =
    entityType?.type === ENTITY_TYPE.VIEW
      ? `create view ${entityType.schema}.${entityType.name} as\n`
      : entityType?.type === ENTITY_TYPE.MATERIALIZED_VIEW
        ? `create materialized view ${entityType.schema}.${entityType.name} as\n`
        : ''

  const formatDefinition = (value: string) => {
    try {
      return format(value, {
        language: 'postgresql',
        keywordCase: 'lower',
      })
    } catch (err) {
      return value
    }
  }

  const formattedDefinition = formatDefinition(prepend + definition)

  return { formattedDefinition, isLoading }
}

export default useTableDefinition
