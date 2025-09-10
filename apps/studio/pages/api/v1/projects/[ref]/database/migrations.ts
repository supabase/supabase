import { NextApiRequest, NextApiResponse } from 'next'

import { fetchPost } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import apiWrapper from 'lib/api/apiWrapper'
import { PG_META_URL } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}
const listMigrationVersions =
  'select version, name from supabase_migrations.schema_migrations order by version'

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)

  const response = await fetchPost(
    `${PG_META_URL}/query`,
    { query: listMigrationVersions },
    { headers }
  )

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message })
  } else {
    return res.status(200).json(response)
  }
}

export const initialiseHistoryTable = `begin;

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
alter table supabase_migrations.schema_migrations add column if not exists statements text[];
alter table supabase_migrations.schema_migrations add column if not exists name text;

commit;`

export function applyAndTrackMigrations(query: string, name?: string) {
  // Escapes literals using postgres dollar quoted string
  const dollar = `$${makeRandomString(20)}$`
  const quote = (s?: string) => (s ? dollar + s + dollar : `''`)
  return `begin;

-- apply sql from post body
${query};

-- track statements in history table
insert into supabase_migrations.schema_migrations (version, name, statements)
values (
  to_char(current_timestamp, 'YYYYMMDDHHMISS'),
  ${quote(name)},
  array[${quote(query)}]
);

commit;`
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = constructHeaders(req.headers)

  const { error } = await fetchPost(
    `${PG_META_URL}/query`,
    { query: initialiseHistoryTable },
    { headers }
  )
  if (error) {
    const { code, message } = error
    return res.status(code).json({ message, formattedError: message })
  }

  const { query, name } = req.body
  const response = await fetchPost(
    `${PG_META_URL}/query`,
    { query: applyAndTrackMigrations(query, name) },
    { headers }
  )

  if (response.error) {
    const { code, message } = response.error
    return res.status(code).json({ message, formattedError: message })
  } else {
    return res.status(200).json(response)
  }
}
