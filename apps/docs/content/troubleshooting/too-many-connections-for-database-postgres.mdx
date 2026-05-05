---
title = "Database: \"Error: too many connections for database \"postgres\"\""
topics = [ "database" ]
keywords = []
---

When getting an error where your connections are overwhelmed `Error: too many connections for database "postgres"`

## Why this occurs

This issue occurs when `datconnlimit` gets modified. The default value for `datconnlimit` is -1.
https://www.postgresql.org/docs/current/catalog-pg-database.html

## To check and resolve

1.  **Check the value for `datconnlimit` using the query below**

    ```bash
    select datconnlimit from pg_database where datname='postgres';
    ```

    - If the value you see is 0 or any other value other than -1, proceed with the next step.

2.  **Update `datconnlimit` to DEFAULT**
    ```bash
    ALTER DATABASE postgres CONNECTION LIMIT DEFAULT;
    ```
