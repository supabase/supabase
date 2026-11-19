/**
 * TEMPORARY: whether the project's database is Spark, which cannot run every statement Studio
 * sends (see `lib/api/self-hosted/spark`). The self-hosted project route sets `database_engine`
 * when the CLI runs Studio on Spark. Exit condition: Spark runs that SQL.
 */
export const isSparkProject = (project: object | undefined): boolean =>
  project !== undefined && 'database_engine' in project && project.database_engine === 'spark'
