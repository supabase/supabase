NixOS
=====

Nixpkgs contains a `NixOS module to run PostgREST <https://search.nixos.org/options?channel=unstable&query=services.postgrest&type=options>`_, which can be enabled with ``services.postgrest.enable = true``.

A PostgreSQL server can be enabled on the same machine with ``services.postgresql.enable = true``. Connections will use the name of the system user as user and database names by default, in this case ``postgrest``.

A minimal example could look like this:

.. code-block:: nix

  {
    pkgs,
    ...
  }:

  {
    services.postgresql = {
      enable = true;
      initialScript = pkgs.writeText "init.sql" ''
        CREATE ROLE postgrest LOGIN NOINHERIT;
        CREATE ROLE anon ROLE postgrest;
      '';
    };

    services.postgrest = {
      enable = true;
      settings.db-anon-role = "anon";
      settings.db-uri.dbname = "postgres";
    };
  }

This will expose the PostgREST server on localhost on the NixOS machine and allow anonymous access.

.. tip::
  NixOS also allows to quickly spin up different PostgreSQL versions or even forks this way. For example, to test the current beta version of `OrioleDB <https://www.orioledb.com>`_, use ``services.postgresql.package = pkgs.orioledb``.
