.. _providing_img:

Providing images for ``<img>``
==============================

:author: `pkel <https://github.com/pkel>`_

In this how-to, you will learn how to create an endpoint for providing images to HTML :code:`<img>` tags without client side JavaScript. In fact, the presented technique is suitable for providing not only images, but arbitrary files.

We will start with a minimal example that highlights the general concept.
Afterwards we present a more detailed solution that fixes a few shortcomings of the first approach.

.. warning::

   Be careful when saving binaries in the database, having a separate storage service for these is preferable in most cases. See `Storing Binary files in the Database <https://wiki.postgresql.org/wiki/BinaryFilesInDB>`_.

Minimal Example
---------------

First, we need a public table for storing the files.

.. code-block:: postgres

   create table files(
     id   int primary key
   , blob bytea
   );

Let's assume this table contains an image of two cute kittens with id 42. We can retrieve this image in binary format from our PostgREST API by using :ref:`custom_media`:

.. code-block:: postgres

   create domain "application/octet-stream" as bytea;

   create or replace function file(id int) returns "application/octet-stream" as $$
     select blob from files where id = file.id;
   $$ language sql;

Now we can request the RPC endpoint :code:`/rpc/file?id=42` with the :code:`Accept: application/octet-stream` header.


.. code-block:: bash

   curl "localhost:3000/rpc/file?id=42" -H "Accept: application/octet-stream"


Unfortunately, putting the URL into the :code:`src` of an :code:`<img>` tag will not work. That's because browsers do not send the required :code:`Accept: application/octet-stream` header.
Instead, the :code:`Accept: image/webp` header is sent by many web browsers by default.

Luckily we can change the accepted media type in the function like so:

.. code-block:: postgres

   create domain "image/webp" as bytea;

   create or replace function file(id int) returns "image/webp" as $$
     select blob from files where id = file.id;
   $$ language sql;

Now, the image will be displayed in the HTML page:

.. code-block:: html

   <img src="http://localhost:3000/file?id=42" alt="Cute Kittens"/>

Improved Version
----------------

The basic solution has some shortcomings:

1.  The response :code:`Content-Type` header is set to :code:`image/webp`.
    This might be a problem if you want to specify a different format for the file.
2.  Download requests (e.g. Right Click -> Save Image As) to :code:`/files?select=blob&id=eq.42` will propose :code:`files` as filename.
    This might confuse users.
3.  Requests to the binary endpoint are not cached.
    This will cause unnecessary load on the database.

The following improved version addresses these problems.
First, in addition to the minimal example, we need to store the media types and names of our files in the database.

.. code-block:: postgres

   alter table files
     add column type text generated always as (byteamagic_mime(substr(blob, 0, 4100))) stored,
     add column name text;

This uses the :code:`byteamagic_mime()` function from the `pg_byteamagic extension <https://github.com/nmandery/pg_byteamagic>`_ to automatically generate the type in the :code:`files` table. To guess the type of a file, it's generally enough to look at the beginning of the file, which is more efficient.

Next, we set modify the function to set the content type and filename.
We use this opportunity to configure some basic, client-side caching.
For production, you probably want to configure additional caches, e.g. on the :ref:`reverse proxy <nginx>`.

.. code-block:: postgres

   create domain "*/*" as bytea;

   create function file(id int) returns "*/*" as
   $$
     declare headers text;
     declare blob bytea;
     begin
       select format(
         '[{"Content-Type": "%s"},'
          '{"Content-Disposition": "inline; filename=\"%s\""},'
          '{"Cache-Control": "max-age=259200"}]'
         , files.type, files.name)
       from files where files.id = file.id into headers;
       perform set_config('response.headers', headers, true);
       select files.blob from files where files.id = file.id into blob;
       if FOUND -- special var, see https://www.postgresql.org/docs/current/plpgsql-statements.html#PLPGSQL-STATEMENTS-DIAGNOSTICS
       then return(blob);
       else raise sqlstate 'PT404' using
         message = 'NOT FOUND',
         detail = 'File not found',
         hint = format('%s seems to be an invalid file id', file.id);
       end if;
     end
   $$ language plpgsql;

With this, we can obtain the cat image from :code:`/rpc/file?id=42`. Thus, the resulting HTML will be:

.. code-block:: html

   <img src="http://localhost:3000/rpc/file?id=42" alt="Cute Kittens"/>
