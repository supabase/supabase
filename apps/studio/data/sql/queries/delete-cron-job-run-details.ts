import { literal } from '@supabase/pg-meta/src/pg-format'

import { sqlKeys } from '../keys'

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
SELECT relpages
FROM pg_class
WHERE relname = 'job_run_details'
  AND relnamespace = 'cron'::regnamespace;
`.trim()

export const getJobRunDetailsPageCountKey = (projectRef: string | undefined) =>
  sqlKeys.query(projectRef, ['cron-job-run-details', 'page-count'])

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
) =>
  `
WITH deleted AS (
  DELETE FROM cron.job_run_details
  WHERE ctid >= '(${startPage},0)'::tid
    AND ctid < '(${endPage},0)'::tid
    AND end_time < now() - interval ${literal(interval)}
  RETURNING 1
)
SELECT count(*) as deleted_count FROM deleted;
`.trim()

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
