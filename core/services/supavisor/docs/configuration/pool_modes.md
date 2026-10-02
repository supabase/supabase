Configure the `mode_type` on the `user` to set how Supavisor connection pools
will behave.

The `mode_type` can be one of:

- `transaction`
- `session`
- `native`

## Transaction Mode

`transaction` mode assigns a connection to a client for the duration of a single
transaction.

## Session Mode

`session` mode assigns a connection to a client for the duration of the client
connection.

## Native Mode

`native` mode proxies a client to the database as if it was directly connected.

This mode is typically needed to run migrations.
