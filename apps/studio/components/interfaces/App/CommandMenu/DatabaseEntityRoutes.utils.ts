type EntityLocation = { id: number; schema: string }

function getDatabaseEditRoute({
  projectRef,
  page,
  schema,
  edit,
}: {
  projectRef: string
  page: string
  schema: string
  edit: string | number
}): `/${string}` {
  const params = `schema=${encodeURIComponent(schema)}&edit=${encodeURIComponent(String(edit))}`
  return `/project/${projectRef}/database/${page}?${params}`
}

export function getTableEditorRoute(projectRef: string, table: EntityLocation): `/${string}` {
  return `/project/${projectRef}/editor/${table.id}?schema=${encodeURIComponent(table.schema)}`
}

export function getPolicyEditorRoute(projectRef: string, policy: EntityLocation): `/${string}` {
  return getDatabaseEditRoute({
    projectRef,
    page: 'policies',
    schema: policy.schema,
    edit: policy.id,
  })
}

export function getTriggerEditorRoute(projectRef: string, trigger: EntityLocation): `/${string}` {
  return getDatabaseEditRoute({
    projectRef,
    page: 'triggers/data',
    schema: trigger.schema,
    edit: trigger.id,
  })
}

export function getFunctionEditorRoute(projectRef: string, fn: EntityLocation): `/${string}` {
  return getDatabaseEditRoute({ projectRef, page: 'functions', schema: fn.schema, edit: fn.id })
}

export function getIndexEditorRoute(
  projectRef: string,
  index: { name: string; schema: string }
): `/${string}` {
  return getDatabaseEditRoute({
    projectRef,
    page: 'indexes',
    schema: index.schema,
    edit: index.name,
  })
}
