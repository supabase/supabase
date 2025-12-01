export const USER_SEARCH_INDEXES = [
  'idx_users_email',
  'idx_users_email_trgm',
  'idx_users_created_at_desc',
  'idx_users_last_sign_in_at_desc',
  'idx_users_name_trgm',
  // this index is not created by the indexworker but is required for efficient queries
  // it is already created as part of the `UNIQUE` constraint on the `phone` column
  'users_phone_key',
]
