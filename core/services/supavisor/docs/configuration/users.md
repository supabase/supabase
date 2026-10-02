All configuration options for a tenant `user` are stored on the `user` record in
the metadata database used by Supavisor.

All `user` fields and their types are defined in the `Supavisor.Tenants.User`
module.

## Field Descriptions

`db_user` - user to match against the client connection user

`db_password` - password to match against the client connection password

`db_user_alias` - client connection user will also match this user record

`is_manager` - these credentials are used to perform management queries against
the tenant database

`mode_type` - the pool mode type

`pool_size` - the database connection pool size used to override
`default_pool_size` on the `tenant`

`pool_checkout_timeout` - the maximum duration allowed for a client connection
to checkout a database connection from the pool

`max_clients` - the maximum amount of client connections allowed for this user
