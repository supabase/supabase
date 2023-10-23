import { JwtSecretUpdateError, JwtSecretUpdateProgress } from '@supabase/shared-types/out/events'

export const JWT_SECRET_UPDATE_ERROR_MESSAGES = {
  [JwtSecretUpdateError.APIServicesConfigurationUpdateFailed]:
    'failed to update configuration for API services',
  [JwtSecretUpdateError.APIServicesRestartFailed]: 'failed to restart API services',
  [JwtSecretUpdateError.DatabaseAdminAPIConfigurationUpdateFailed]:
    'failed to update configuration for database admin API',
  [JwtSecretUpdateError.PostgreSQLRestartFailed]: 'failed to restart PostgreSQL service',
  [JwtSecretUpdateError.SupabaseAPIKeyUpdateFailed]: 'failed to update Supabase API key',
  [JwtSecretUpdateError.APIGatewayUpdateFailed]: 'failed to update API Gateway',
}

export const JWT_SECRET_UPDATE_PROGRESS_MESSAGES = {
  [JwtSecretUpdateProgress.RestartedAPIServices]: 'restarted API services',
  [JwtSecretUpdateProgress.RestartedPostgreSQL]: 'restarted PostgreSQL service',
  [JwtSecretUpdateProgress.Started]: 'started updating',
  [JwtSecretUpdateProgress.UpdatedAPIServicesConfiguration]:
    'updated configuration for API services',
  [JwtSecretUpdateProgress.UpdatedDatabaseAdminAPIConfiguration]:
    'updated configuration for database admin API',
  [JwtSecretUpdateProgress.UpdatedAPIGatewayConfiguration]: 'updated configuration for API Gateway',
}
