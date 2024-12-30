# Supachat Dynamic Table Partitioning Example

This is example code for the [Supachat Dynamic Table Partitioning blog post]().

Postgres has many powerful partitioning features ranging from simple
declarative partitioning to fine-grained control over how child tables
are attached and detached.

The documentation for more advanced usage of these features [is quite
detailed](https://www.postgresql.org/docs/current/ddl-partitioning.html),
but based on some customer experience, we've noticed users often end
up considering partitioning after already having a lot of data in one
big table.  We've decided to create an example chat application that
shows how to use some of the more interesting features of Postgres
partitioning for migrating from the one "Large Table" problem with
minimal down time.
