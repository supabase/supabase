Architecture
############

This page describes the architecture of PostgREST.

Bird's Eye View
===============

You can click on the components to navigate to their respective documentation.

  .. container:: img-dark

    .. See https://github.com/sphinx-doc/sphinx/issues/2240#issuecomment-187366626

    .. raw:: html

      <object width="100%" data="../_static/arch-dark.svg" type="image/svg+xml"></object>

  .. container:: img-light

    .. raw:: html

      <object width="100%" data="../_static/arch.svg" type="image/svg+xml"></object>


Code Map
========

This section talks briefly about various important modules.

Main
----

The starting point of the program is `Main.hs <https://github.com/PostgREST/postgrest/blob/main/src/executable/Main.hs>`_.

CLI
---

Main then calls `CLI.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/CLI.hs>`_, which is in charge of :ref:`cli`.

App
---

`App.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/App.hs>`_ is then in charge of composing the different modules.

Auth
----

`Auth.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/Auth.hs>`_ is in charge  of :ref:`authn`.

Api Request
-----------

`ApiRequest.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/ApiRequest.hs>`_ is in charge of parsing the URL query string (following PostgREST syntax), the request headers, and the request body.

A request might be rejected at this level if it's invalid. For example when providing an unknown media type to PostgREST or using an unknown HTTP method.

Plan
----

Using the Schema Cache, `Plan.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/Plan.hs>`_ generates an internal AST, filling out-of-band SQL details (like an ``ON CONFLICT (pk)`` clause) required to complete the user request.

A request might be rejected at this level if it's invalid. For example when doing resource embedding on a nonexistent resource.

Query
-----

`Query.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/Query.hs>`_ generates the SQL queries (parametrized and prepared) required to satisfy the user request.

Only at this stage a connection from the pool might be used.

Schema Cache
------------

`SchemaCache.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/SchemaCache.hs>`_ is in charge of :ref:`schema_cache`.

Config
------

`Config.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/Config.hs>`_ is in charge of :ref:`configuration`.

Admin
-----

`Admin.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/Admin.hs>`_ is in charge of the :ref:`admin_server`.

Listener
--------

`Reload.hs <https://github.com/PostgREST/postgrest/blob/main/src/library/PostgREST/AppState/Reload.hs>`_ is in charge of the :ref:`listener`.
