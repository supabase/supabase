.. title:: PostgREST Documentation

PostgREST Documentation
=======================

.. container:: image-container

  .. figure:: ../static/postgrest.png

.. image:: https://img.shields.io/github/stars/postgrest/postgrest.svg?style=social
  :target: https://github.com/PostgREST/postgrest

.. image:: https://img.shields.io/github/v/release/PostgREST/postgrest.svg
  :target: https://github.com/PostgREST/postgrest/releases

.. image:: https://img.shields.io/docker/pulls/postgrest/postgrest.svg
  :target: https://hub.docker.com/r/postgrest/postgrest/

.. image:: https://img.shields.io/badge/Donate-Patreon-orange.svg?colorB=F96854
  :target: https://www.patreon.com/postgrest

|

PostgREST is a standalone web server that turns your PostgreSQL database directly into a RESTful API. The structural constraints and permissions in the database determine the API endpoints and operations.

Sponsors
--------

.. container:: image-container

  .. container:: img-dark

    .. image:: ../static/cybertec-dark.svg
      :target: https://www.cybertec-postgresql.com/en/?utm_source=postgrest.org&utm_medium=referral&utm_campaign=postgrest

  .. container:: img-light

    .. image:: ../static/cybertec.svg
      :target: https://www.cybertec-postgresql.com/en/?utm_source=postgrest.org&utm_medium=referral&utm_campaign=postgrest

  .. container:: img-dark

    .. image:: ../static/supabase-dark.svg
      :target: https://supabase.com/?utm_source=postgrest%20backers&utm_medium=open%20source%20partner&utm_campaign=postgrest%20backers%20github&utm_term=homepage

  .. container:: img-light

    .. image:: ../static/supabase.svg
      :target: https://supabase.com/?utm_source=postgrest%20backers&utm_medium=open%20source%20partner&utm_campaign=postgrest%20backers%20github&utm_term=homepage

  .. container:: img-dark

    .. image:: ../static/euronodes.svg
      :target: https://www.euronodes.com/postgrest

  .. container:: img-light

    .. image:: ../static/euronodes.svg
      :target: https://www.euronodes.com/postgrest

  |

  .. container:: img-dark

    .. image:: ../static/neon-dark.jpg
      :target: https://neon.com/?utm_source=sponsor&utm_campaign=postgrest

  .. container:: img-light

    .. image:: ../static/neon.jpg
      :target: https://neon.com/?utm_source=sponsor&utm_campaign=postgrest

  .. container:: img-dark

    .. image:: ../static/bytebase-dark.svg
      :target: https://www.bytebase.com/?utm_source=sponsor&utm_campaign=postgrest

  .. container:: img-light

    .. image:: ../static/bytebase.svg
      :target: https://www.bytebase.com/?utm_source=sponsor&utm_campaign=postgrest

  .. The static/empty.png(created with `convert -size 320x95 xc:#fcfcfc empty.png`) is an ugly workaround
     to create space and center the logos. It's not easy to layout with restructuredText.

  .. image:: _static/empty.png
    :target: #sponsors

|

Database as Single Source of Truth
----------------------------------

Using PostgREST is an alternative to manual CRUD programming. Custom API servers suffer problems. Writing business logic often duplicates, ignores or hobbles database structure. Object-relational mapping is a leaky abstraction leading to slow imperative code. The PostgREST philosophy establishes a single declarative source of truth: the data itself.

Declarative Programming
-----------------------

It's easier to ask PostgreSQL to join data for you and let its query planner figure out the details than to loop through rows yourself. It's easier to assign permissions to database objects than to add guards in controllers. (This is especially true for cascading permissions in data dependencies.) It's easier to set constraints than to litter code with sanity checks.

Leak-proof Abstraction
----------------------

There is no ORM involved. Creating new views happens in SQL with known performance implications. A database administrator can now create an API from scratch with no custom programming.

One Thing Well
--------------

PostgREST has a focused scope. It works well with other tools like Nginx. This forces you to cleanly separate the data-centric CRUD operations from other concerns. Use a collection of sharp tools rather than building a big ball of mud.

Getting Support
----------------

The project has a friendly and growing community. For discussions, use the Github `discussions page <https://github.com/PostgREST/postgrest/discussions>`_. You can also report or search for bugs/features on the Github `issues <https://github.com/PostgREST/postgrest/issues>`_ page.

Releases
--------

PostgREST follows ``MAJOR.PATCH`` two-part versioning:

- ``MAJOR``: feature release, may introduce new features, deprecate existing features, or remove previously deprecated features.
- ``PATCH``: fix/security release only, no features and no behavior changes.

MAJOR releases are published twice a year, with their scope and target dates tracked through `GitHub milestones <https://github.com/PostgREST/postgrest/milestones>`_.
PATCH releases are published on an as-needed basis.

Starting from ``v14.0``, only even-numbered MAJOR versions are released, reserving odd-numbered MAJOR versions for development.

All releases are published on `PostgREST's GitHub release page <https://github.com/PostgREST/postgrest/releases>`_, along with the corresponding upgrade guides.

.. _depol:

Deprecation policy
~~~~~~~~~~~~~~~~~~

- A supported feature will remain deprecated for at least one but no more than two MAJOR releases before it is removed.
- Deprecations only apply to the API and configuration options.
- Use of deprecated features will raise a deprecation warning to provide users with notice and a migration path before removal.
- Exceptions may be made for security vulnerabilities, cases where maintaining compatibility would impose significant maintenance burden or experimental/undocumented functionality.

Tutorials
---------

Are you new to PostgREST? This is the place to start!

.. toctree::
   :glob:
   :caption: Tutorials
   :maxdepth: 1

   tutorials/*

Also have a look at :ref:`install` and :ref:`community_tutorials`.

References
----------

Technical references for PostgREST's functionality.

.. toctree::
   :glob:
   :caption: References
   :name: references
   :maxdepth: 1

   references/auth.rst
   references/api.rst
   references/cli.rst
   references/transactions.rst
   references/connection_pool.rst
   references/schema_cache.rst
   references/errors.rst
   references/configuration.rst
   references/observability.rst
   references/*

Explanations
------------

Key concepts in PostgREST.

.. toctree::
   :glob:
   :caption: Explanations
   :name: explanations
   :maxdepth: 1

   explanations/*

How-tos
-------

Recipes that'll help you address specific use-cases.

.. toctree::
   :glob:
   :caption: How-to guides
   :name: how-tos
   :maxdepth: 1

   how-tos/sql-user-*
   how-tos/working-*
   how-tos/*

.. _intgrs:

Integrations
------------

.. toctree::
   :glob:
   :caption: Integrations
   :name: integrations
   :maxdepth: 1

   integrations/*

Ecosystem
---------

PostgREST has a growing ecosystem of examples, libraries, and experiments. Here is a selection.

.. toctree::
   :caption: Ecosystem
   :name: ecosystem
   :maxdepth: 1

   ecosystem.rst

In Production
-------------

Here are some companies that use PostgREST in production.

* `Catarse <https://www.catarse.me>`_
* `Drip Depot <https://www.dripdepot.com>`_
* `Image-charts <https://www.image-charts.com>`_
* `Netwo <https://www.netwo.io>`_
* `Nimbus <https://www.nimbusfacility.com/sg/home>`_
  - See how Nimbus uses PostgREST in `Paul Copplestone's blog post <https://paul.copplest.one/blog/nimbus-tech-2019-04.html>`_.
* `OpenBooking <https://openbooking.ch>`_
* `Supabase <https://supabase.com>`_

Testimonials
------------

  "It's so fast to develop, it feels like cheating!"

  -- François-Guillaume Ribreau

  "I just have to say that, the CPU/Memory usage compared to our
  Node.js/Waterline ORM based API is ridiculous.  It's hard to even push
  it over 60/70 MB while our current API constantly hits 1GB running on 6
  instances (dynos)."

  -- Louis Brauer

  "I really enjoyed the fact that all of a sudden I was writing
  microservices in SQL DDL (and v8 JavaScript functions). I dodged so
  much boilerplate. The next thing I knew, we pulled out a full rewrite
  of a Spring+MySQL legacy app in 6 months. Literally 10x faster, and
  code was super concise. The old one took 3 years and a team of 4
  people to develop."

  -- Simone Scarduzio

  "I like the fact that PostgREST does one thing, and one thing well.
  While PostgREST takes care of bridging the gap between our HTTP server
  and PostgreSQL database, we can focus on the development of our API in
  a single language: SQL. This puts the database in the center of our
  architecture, and pushed us to improve our skills in SQL programming
  and database design."

  -- Eric Bréchemier, Data Engineer, eGull SAS

  "PostgREST is performant, stable, and transparent. It allows us to
  bootstrap projects really fast, and to focus on our data and application
  instead of building out the ORM layer. In our k8s cluster, we run a few
  pods per schema we want exposed, and we scale up/down depending on demand.
  Couldn't be happier."

  -- Anupam Garg, Datrium, Inc.

Contributing
------------

Please see the `Contributing guidelines <https://github.com/PostgREST/postgrest/blob/main/CONTRIBUTING.md>`_ in the main PostgREST repository.

.. raw:: html

  <script type="text/javascript">
    let hash = window.location.hash;

    const redirects = {
      // Tables and Views
      '#release-notes': '#releases',
    };

    let willRedirectTo = redirects[hash];

    if (willRedirectTo) {
      window.location.href = willRedirectTo;
    }
  </script>
