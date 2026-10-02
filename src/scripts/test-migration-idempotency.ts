import dotenv from 'dotenv'

dotenv.config()

import { resetMigration, runMigrationsOnTenant } from '@internal/database/migrations'
import { MIGRATION_RESET_FLOORS } from '@internal/database/migrations/reset-floor'
import { DBMigration } from '@internal/database/migrations/types'
import { getConfig } from '../config'

void (async () => {
  const { databaseURL, dbMigrationFreezeAt } = getConfig()
  const migrations = Object.keys(DBMigration) as (keyof typeof DBMigration)[]
  const lastMigration = dbMigrationFreezeAt
    ? DBMigration[dbMigrationFreezeAt]
    : Math.max(...Object.values(DBMigration))
  const activeResetFloors = MIGRATION_RESET_FLOORS.filter(
    ({ activatedBy }) => DBMigration[activatedBy] <= lastMigration
  )
  const nonReplayableMigrations = new Set<keyof typeof DBMigration>(
    activeResetFloors.map(({ migration }) => migration)
  )
  const firstResetFloor = activeResetFloors.at(0)?.migration ?? 'create-migrations-table'
  const firstMigrationIndex = migrations.indexOf(firstResetFloor)

  let previousMigration: keyof typeof DBMigration = firstResetFloor

  for (const migration of migrations.slice(firstMigrationIndex + 1)) {
    if (nonReplayableMigrations.has(migration)) {
      console.log(`Skipping  migration ${migration}`)
      await resetMigration({
        databaseUrl: databaseURL,
        untilMigration: previousMigration,
        markCompletedTillMigration: migration,
        skipResetFloorValidation: true,
      })

      if (dbMigrationFreezeAt === migration) {
        break
      }

      previousMigration = migration
      continue
    }

    console.log(`Running   migration ${migration}`)
    await runMigrationsOnTenant({
      databaseUrl: databaseURL,
      upToMigration: migration,
    })

    console.log(`Resetting migration ${migration}`)
    await resetMigration({
      databaseUrl: databaseURL,
      untilMigration: previousMigration,
      skipResetFloorValidation: true,
    })

    console.log(`Rerunning migration ${migration}`)
    await runMigrationsOnTenant({
      databaseUrl: databaseURL,
      upToMigration: migration,
    })

    if (dbMigrationFreezeAt === migration) {
      break
    }

    previousMigration = migration
  }
})()
