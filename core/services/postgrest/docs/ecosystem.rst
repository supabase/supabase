.. _community_tutorials:

Community Tutorials
-------------------

* `Building a Contacts List with PostgREST and Vue.js <https://www.youtube.com/watch?v=iHtsALtD5-U>`_ -
  In this video series, DigitalOcean shows how to build and deploy an Nginx + PostgREST(using a managed PostgreSQL database) + Vue.js webapp in an Ubuntu server droplet.

* `PostgREST + Auth0: Create REST API in minutes, and add social login using Auth0 <https://samkhawase.com/blog/postgrest-1-introduction/>`_ - A step-by-step tutorial to show how to dockerize and integrate Auth0 to PostgREST service.

* `"CodeLess" backend using postgres, postgrest and oauth2 authentication with keycloak <https://www.mathieupassenaud.fr/codeless_backend/>`_ -
  A step-by-step tutorial for using PostgREST with KeyCloak(hosted on a managed service).

* `How PostgreSQL triggers work when called with a PostgREST PATCH HTTP request <https://blog.fgribreau.com/2020/11/how-postgresql-triggers-works-when.html>`_ - A tutorial to see how the old and new values are set or not when doing a PATCH request to PostgREST.

* `REST Data Service on YugabyteDB / PostgreSQL <https://dev.to/yugabyte/rest-data-service-on-yugabytedb-postgresql-5f2h>`_

* `Build data-driven applications with Workers and PostgreSQL <https://developers.cloudflare.com/workers/tutorials/postgres/>`_ - A tutorial on how to integrate with PostgREST and PostgreSQL using Cloudflare Workers.

* `A poor man's API <https://blog.frankel.ch/poor-man-api>`_ - Shows how to integrate PostgREST with Apache APISIX as an alternative to Nginx.

.. * `Accessing a PostgreSQL database in Godot 4 via PostgREST <https://peterkingsbury.com/2022/08/16/godot-postgresql-postgrest/>`_

.. _templates:

Templates
---------

* `compose-postgrest <https://github.com/mattddowney/compose-postgrest>`_ - docker-compose setup with Nginx and HTML example
* `svelte-postgrest-template <https://github.com/guyromm/svelte-postgrest-template>`_ - Svelte/SvelteKit, PostgREST, EveryLayout and social auth

.. _eco_example_apps:

Example Apps
------------

* `archtika <https://github.com/thiloho/archtika>`_ - self-hosted CMS
* `delibrium-postgrest <https://gitlab.com/delibrium/delibrium-postgrest/>`_ - example school API and front-end in Vue.js
* `ETH-transactions-storage <https://github.com/Adamant-im/ETH-transactions-storage>`_ - indexer for Ethereum to get transaction list by ETH address
* `fullstack template <https://github.com/jenstroeger/fullstack-webapp-template>`_ - a complete fullstack webapp template using PG as db and message queue, Python and Dramatiq to implement async jobs, db migrations, test runners, and more.
* `general <https://github.com/PierreRochard/general>`_ - example auth back-end
* `guild-operators <https://github.com/cardano-community/koios-artifacts/tree/main/files/grest>`_ - example queries and functions that the Cardano Community uses for their Guild Operators' Repository
* `PostGUI <https://github.com/priyank-purohit/PostGUI>`_ - React Material UI admin panel
* `prospector <https://github.com/sfcta/prospector>`_ - data warehouse and visualization platform

.. _devops:

DevOps
------

* `cloudgov-demo-postgrest <https://github.com/GSA/cloudgov-demo-postgrest>`_ - demo for a federally-compliant REST API on cloud.gov
* `cloudstark/helm-charts <https://github.com/cloudstark/helm-charts/tree/master/postgrest>`_ - helm chart to deploy PostgREST to a Kubernetes cluster via a Deployment and Service
* `cyril-sabourault/postgrest-cloud-run <https://github.com/cyril-sabourault/postgrest-cloud-run>`_ - expose a PostgreSQL database on Cloud SQL using Cloud Run
* `eyberg/postgrest <https://repo.ops.city/v2/packages/eyberg/postgrest/10.1.1/x86_64/show>`_ - run PostgREST as a Nanos unikernel
* `jbkarle/postgrest <https://github.com/jbkarle/postgrest>`_ - helm chart with a demo database for development and test purposes

.. _eco_external_notification:

External Notification
---------------------

These are PostgreSQL bridges that propagate LISTEN/NOTIFY to external queues for further processing. This allows functions to initiate actions outside the database such as sending emails.

* `pg-notify-stdout <https://github.com/mkleczek/pg-notify-stdout>`_ - writes notifications to standard output (use in shell scripts etc.)
* `pg-notify-webhook <https://github.com/vbalasu/pg-notify-webhook>`_ - trigger webhooks from PostgreSQL's LISTEN/NOTIFY
* `pgsql-listen-exchange <https://github.com/gmr/pgsql-listen-exchange>`_ - RabbitMQ
* `postgres-websockets <https://github.com/diogob/postgres-websockets>`_ - expose web sockets for PostgreSQL's LISTEN/NOTIFY
* `postgresql2websocket <https://github.com/frafra/postgresql2websocket>`_ - Websockets


.. _eco_extensions:

Extensions
----------

* `aiodata <https://github.com/Exahilosys/aiodata>`_ - Python, event-based proxy and caching client.
* `pg-safeupdate <https://github.com/eradman/pg-safeupdate>`_ - prevent full-table updates or deletes
* `postgrest-node <https://github.com/seveibar/postgrest-node>`_ - Run a PostgREST server in Node.js via npm module
* `PostgREST-writeAPI <https://github.com/ppKrauss/PostgREST-writeAPI>`_ - generate Nginx rewrite rules to fit an OpenAPI spec

.. _clientside_libraries:

Client-Side Libraries
---------------------

* `efcore-postgrest <https://github.com/pedro-gilmora/EF.PostgREST.Provider>`_ - C#
* `postgrest-csharp <https://github.com/supabase-community/postgrest-csharp>`_ - C#
* `postgrest-dart <https://github.com/supabase/postgrest-dart>`_ - Dart
* `postgrest-ex <https://github.com/supabase-community/postgrest-ex>`_ - Elixir
* `postgrest-go <https://github.com/supabase-community/postgrest-go>`_ - Go
* `postgrest-js <https://github.com/supabase/postgrest-js>`_ - TypeScript/JavaScript
* `postgrest-kt <https://github.com/supabase-community/postgrest-kt>`_ - Kotlin
* `postgrest-py <https://github.com/supabase/postgrest-py>`_ - Python
* `postgrest-rs <https://github.com/supabase-community/postgrest-rs>`_ - Rust
* `postgrest-swift <https://github.com/supabase-community/postgrest-swift>`_ - Swift
* `redux-postgrest <https://github.com/andytango/redux-postgrest>`_ - TypeScript/JS, client integrated with (React) Redux.
* `vue-postgrest <https://github.com/technowledgy/vue-postgrest>`_ - Vue.js

