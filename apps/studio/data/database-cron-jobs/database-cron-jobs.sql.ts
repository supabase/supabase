import { literal } from '@supabase/pg-meta/src/pg-format'

import { sqlKeys } from '../sql/keys'

const CRON_CLEANUP_SCHEDULE_NAME = 'delete-job-run-details'
const CRON_CLEANUP_SCHEDULE_EXPRESSION = '0 12 * * *'

// Number of pages to process in each batch for ctid-based deletion
// Based on default Postgres shared buffer size of 128 MB, which fits ~16k pages
export const CTID_BATCH_PAGE_SIZE = 5_000

/**
 * Get the total number of pages in the job_run_details table.
 * This is used to iterate through the table in batches using ctid ranges.
 */
export const getJobRunDetailsPageCountSql = () =>
  `
SELECT pg_relation_size(oid) / current_setting('block_size')::int8 AS num_pages
FROM pg_class
WHERE relname = 'job_run_details'
  AND relnamespace = 'cron'::regnamespace;
`.trim()

export const getJobRunDetailsPageCountKey = (projectRef: string | undefined) =>
  sqlKeys.query(projectRef, ['cron-job-run-details', 'page-count'])

/**
 * Validates that a value is a finite non-negative integer.
 */
function validatePageNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative integer, got: ${value}`)
  }
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
) => {
  validatePageNumber(startPage, 'startPage')
  validatePageNumber(endPage, 'endPage')

  // After validation, these are guaranteed to be safe integers
  // Using literal() on the string representation ensures proper escaping
  const safeCtidStart = literal(`(${startPage},0)`)
  const safeCtidEnd = literal(`(${endPage},0)`)

  return `
WITH deleted AS (
  DELETE FROM cron.job_run_details
  WHERE ctid >= ${safeCtidStart}::tid
    AND ctid < ${safeCtidEnd}::tid
    AND end_time < now() - interval ${literal(interval)}
  RETURNING 1
)
SELECT count(*) as deleted_count FROM deleted;
`.trim()
}

export const getDeleteOldCronJobRunDetailsByCtidKey = (
  projectRef: string | undefined,
  interval: string,
  startPage: number
) => sqlKeys.query(projectRef, ['cron-job-run-details', 'delete-batch', interval, startPage])

export const getScheduleDeleteCronJobRunDetailsSql = (interval: string) =>
  `
SELECT cron.schedule(
  ${literal(CRON_CLEANUP_SCHEDULE_NAME)},
  ${literal(CRON_CLEANUP_SCHEDULE_EXPRESSION)},
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval ${literal(interval)}$$
);
`.trim()

export const getScheduleDeleteCronJobRunDetailsKey = (
  projectRef: string | undefined,
  interval: string
) => sqlKeys.query(projectRef, ['cron-job-run-details', 'schedule', interval])

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
