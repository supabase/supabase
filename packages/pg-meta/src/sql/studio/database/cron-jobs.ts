import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCronJobsMinimalSql = ({
  searchTerm,
  page,
  limit,
}: {
  searchTerm?: string
  page: number
  limit: number
}): SafeSqlFragment => {
  const searchClause = searchTerm
    ? safeSql`WHERE job.jobname ILIKE ${literal(`%${searchTerm}%`)}`
    : safeSql``
  return safeSql`
SELECT
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active
FROM
  cron.job job
${searchClause}
ORDER BY job.jobid
LIMIT ${literal(limit)}
OFFSET ${literal(page * limit)};`
}

export const getCronJobsSql = ({
  searchTerm,
  page,
  limit,
}: {
  searchTerm?: string
  page: number
  limit: number
}): SafeSqlFragment => {
  const searchClause = searchTerm
    ? safeSql`WHERE job.jobname ILIKE ${literal(`%${searchTerm}%`)}`
    : safeSql``
  return safeSql`
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
${searchClause}
ORDER BY job.jobid
LIMIT ${literal(limit)}
OFFSET ${literal(page * limit)};`
}

/**
 * Delete old cron job run details using ctid range filtering.
 * This approach:
 * 1. Only scans a bounded range of pages (not the full table)
 * 2. Avoids buffer cache pollution by processing in chunks
 * 3. Allows other queries to proceed between batches
 *
 * @param interval - The age threshold (e.g., '7 days')
 * @param startPage - The starting page number (inclusive)
 * @param endPage - The ending page number (exclusive)
 * @returns SQL that deletes matching rows and returns the count of deleted rows
 */
export const getDeleteOldCronJobRunDetailsByCtidSql = (
  interval: string,
  startPage: number,
  endPage: number
): SafeSqlFragment => {
  const safeCtidStart = literal(`(${startPage},0)`)
  const safeCtidEnd = literal(`(${endPage},0)`)

  return safeSql`
WITH deleted AS (
  DELETE FROM cron.job_run_details
  WHERE ctid >= ${safeCtidStart}::tid
    AND ctid < ${safeCtidEnd}::tid
    AND end_time < now() - interval ${literal(interval)}
  RETURNING 1
)
SELECT count(*) as deleted_count FROM deleted;`
}

const CRON_CLEANUP_SCHEDULE_NAME = 'delete-job-run-details'
const CRON_CLEANUP_SCHEDULE_EXPRESSION = '0 12 * * *'

export const getScheduleDeleteCronJobRunDetailsSql = (interval: string): SafeSqlFragment => {
  const command = safeSql`DELETE FROM cron.job_run_details WHERE end_time < now() - interval ${literal(interval)};`

  return safeSql`
SELECT cron.schedule(
  ${literal(CRON_CLEANUP_SCHEDULE_NAME)},
  ${literal(CRON_CLEANUP_SCHEDULE_EXPRESSION)},
  ${literal(command)}
);`
}

/**
 * Get the total number of pages in the job_run_details table.
 * This is used to iterate through the table in batches using ctid ranges.
 */
export const getJobRunDetailsPageCountSql = (): SafeSqlFragment =>
  safeSql`
SELECT pg_relation_size(oid) / current_setting('block_size')::int8 AS num_pages
FROM pg_class
WHERE relname = 'job_run_details'
  AND relnamespace = 'cron'::regnamespace;`
