'use client'

import { useQuery } from '@tanstack/react-query'

import { runQuery } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-run-query'

// GET User Counts by day
const getUserCountsByDay = ({ projectRef, days }: { projectRef: string; days: number }) => {
  const sql = `
    WITH days_series AS (
      SELECT generate_series(
        date_trunc('day', now() - interval '${Number(days) - 1} days'),
        date_trunc('day', now()),
        '1 day'::interval
      )::date AS date
    )
    SELECT
      d.date,
      COALESCE(u.users, 0)::int as users
    FROM
      days_series d
    LEFT JOIN (
      SELECT
        date_trunc('day', created_at AT TIME ZONE 'UTC')::date as date,
        count(id) as users
      FROM
        auth.users
      GROUP BY 1
    ) u ON d.date = u.date
    ORDER BY
      d.date ASC;
  `

  return runQuery({
    projectRef,
    query: sql,
    readOnly: true,
  })
}

export const useGetUserCountsByDay = (projectRef: string, days: number) => {
  return useQuery({
    queryKey: ['user-counts', projectRef, days],
    queryFn: () => getUserCountsByDay({ projectRef, days }),
    enabled: !!projectRef,
    retry: false,
  })
}
