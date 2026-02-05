import { literal } from '@supabase/pg-meta/src/pg-format'

// [Joshen] Just omits the LEFT JOIN as that's the heavy part
export const getCronJobsMinimalSql = ({
  searchTerm,
  page,
  limit,
}: {
  searchTerm?: string
  page: number
  limit: number
}) =>
  `
SELECT 
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active
FROM 
  cron.job job
${!!searchTerm ? `WHERE job.jobname ILIKE ${literal(`%${searchTerm}%`)}` : ''}
ORDER BY job.jobid
LIMIT ${limit}
OFFSET ${page * limit};
`.trim()

export const getCronJobsSql = ({
  searchTerm,
  page,
  limit,
}: {
  searchTerm?: string
  page: number
  limit: number
}) =>
  `
WITH latest_runs AS (
  SELECT 
    jobid,
    status,
    MAX(start_time) AS latest_run
  FROM cron.job_run_details
  GROUP BY jobid, status
), most_recent_runs AS (
  SELECT 
    jobid, 
    status, 
    latest_run
  FROM latest_runs lr1
  WHERE latest_run = (
    SELECT MAX(latest_run) 
    FROM latest_runs lr2 
    WHERE lr2.jobid = lr1.jobid
  )
)
SELECT 
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active,
  mr.latest_run,
  mr.status
FROM 
  cron.job job
LEFT JOIN most_recent_runs mr ON job.jobid = mr.jobid
${!!searchTerm ? `WHERE job.jobname ILIKE ${literal(`%${searchTerm}%`)}` : ''}
ORDER BY job.jobid
LIMIT ${limit}
OFFSET ${page * limit};
`.trim()
