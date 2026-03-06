export const getUserSQL = (userId: string) => {
  const sql = /* SQL */ `
select
  auth.users.id,
  auth.users.email,
  auth.users.banned_until,
  auth.users.created_at,
  auth.users.confirmed_at,
  auth.users.confirmation_sent_at,
  auth.users.is_anonymous,
  auth.users.is_sso_user,
  auth.users.invited_at,
  auth.users.last_sign_in_at,
  auth.users.phone,
  auth.users.raw_app_meta_data,
  auth.users.raw_user_meta_data,
  auth.users.updated_at,
  coalesce(
    (
      select
        array_agg(distinct i.provider)
      from
        auth.identities i
      where
        i.user_id = users.id
    ),
    '{}'::text[]
  ) as providers
from
  auth.users
where id = '${userId}';
`.trim()

  return sql
}
