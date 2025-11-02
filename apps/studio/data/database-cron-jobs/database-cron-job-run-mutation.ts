import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobRunVariables = {
  projectRef: string
  connectionString?: string | null
  jobId: number
}

// [Joshen] JFYI pg_cron doesn't support a run job function OOB just yet
// So this is just merely running the command from within the cron job, will not reset the cron job's timer
// https://github.com/citusdata/pg_cron/issues/226
export async function runDatabaseCronJobCommand({
  projectRef,
  connectionString,
  jobId,
}: DatabaseCronJobRunVariables) {
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `
DO $$
DECLARE
  job_command text;
BEGIN
  select command into job_command from cron.job where jobid = ${jobId};
  EXECUTE job_command;
END $$;
`.trim(),
    queryKey: databaseCronJobsKeys.create(),
  })

  return result
}

type DatabaseCronJobRunData = Awaited<ReturnType<typeof runDatabaseCronJobCommand>>

export const useDatabaseCronJobRunCommandMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseCronJobRunData, ResponseError, DatabaseCronJobRunVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<DatabaseCronJobRunData, ResponseError, DatabaseCronJobRunVariables>(
    (vars) => runDatabaseCronJobCommand(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to run cron job command: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
