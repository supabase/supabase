import { NextApiRequest, NextApiResponse } from 'next'
import apiWrapper from 'lib/api/apiWrapper'
// import { useSchemasQuery } from 'data/database/schemas-query'
// import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
// import { executeSql } from 'data/sql/execute-sql-query'

const requestHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)
export default requestHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { project_ref } = req.query
    if (!project_ref) {
      return res.status(400).json({
        error: 'Missing project_ref in query parameters',
      })
    }

    const project = await getProjectDetail({ ref: project_ref as string }, undefined, {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { Authorization: req.headers.authorization }),
    })

    // const { result } = await executeSql({
    //   projectRef: project_ref as string,
    //   connectionString: project.connectionString,
    //   sql: `
    //     SELECT
    //       schemas.schema_name,
    //       schemas.schema_owner
    //     FROM information_schema.schemata schemas
    //     WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    //     ORDER BY schemas.schema_name;
    //   `,
    // })

    return res.status(200).json({ project })
  } catch (error: unknown) {
    return res.status(500).json({
      error: error?.message,
    })
  }
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({})
}
