All configuration options for a tenant are stored on the `tenant` record in the
metadata database used by Supavisor.

A `tenant` is looked via the `external_id` discovered in the incoming client
connection.

All `tenant` fields and their types are defined in the
`Supavisor.Tenants.Tenant` module.

## Field Descriptions

`db_host` - the hostname of the server to connect to

`db_port` - the port of the server to connect to

`db_database` - the database of the Postgres instance

`external_id` - an id used in an external system used to lookup a tenant

`default_parameter_status` - the default initial connection parameters to use

`ip_version` - the ip address type of the connection to the database server

`upstream_ssl` - enforce an SSL connection on the tenant database

`upstream_verify` - how to verify the ssl certificate

`upstream_tls_ca` - the ca certificate to use when connecting to the database
server

`enforce_ssl` - enforce an SSL connection on client connections

`require_user` - require client connection credentials to match `user`
credentials in the metadata database

`auth_query` - the query to use when matching credential against a client
connection

`default_pool_size` - the default size of the database pool

`sni_hostname` - can be used to match a connection to a specific `tenant` record

`default_max_clients` - the default limit of client connections

`client_idle_timeout` - the maximum duration of an idle client connection

`allow_list` - a list of CIDR ranges which are allowed to connect
