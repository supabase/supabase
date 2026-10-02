.. _create_soap_endpoint:

Create a SOAP endpoint
======================

:author: `fjf2002 <https://github.com/fjf2002>`_

PostgREST supports :ref:`custom_media`. With a bit of work, SOAP endpoints become possible.

Minimal Example
---------------

This example will simply return the request body, inside a tag ``therequestbodywas``.

Add the following function to your PostgreSQL database:

.. code-block:: postgres

   create domain "text/xml" as pg_catalog.xml;

   CREATE OR REPLACE FUNCTION my_soap_endpoint(xml) RETURNS "text/xml" AS $$
   DECLARE
     nsarray CONSTANT text[][] := ARRAY[
       ARRAY['soapenv', 'http://schemas.xmlsoap.org/soap/envelope/']
     ];
   BEGIN
     RETURN xmlelement(
       NAME "soapenv:Envelope",
       XMLATTRIBUTES('http://schemas.xmlsoap.org/soap/envelope/' AS "xmlns:soapenv"),
       xmlelement(NAME "soapenv:Header"),
       xmlelement(
         NAME "soapenv:Body",
         xmlelement(
           NAME theRequestBodyWas,
           (xpath('/soapenv:Envelope/soapenv:Body', $1, nsarray))[1]
         )
       )
    );
   END;
   $$ LANGUAGE plpgsql;

Do not forget to refresh the :ref:`PostgREST schema cache <schema_reloading>`.

Use ``curl`` for a first test:

.. code-block:: bash

    curl http://localhost:3000/rpc/my_soap_endpoint \
        --header 'Content-Type: text/xml' \
        --header 'Accept: text/xml' \
        --data-binary @- <<XML
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header/>
      <soapenv:Body>
        <mySOAPContent>
          My SOAP Content
        </mySOAPContent>
      </soapenv:Body>
    </soapenv:Envelope>
    XML

The output should contain the original request body within the ``therequestbodywas`` entity,
and should roughly look like:

.. code-block:: xml

    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header/>
      <soapenv:Body>
        <therequestbodywas>
          <soapenv:Body xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
            <mySOAPContent>
              My SOAP Content
            </mySOAPContent>
          </soapenv:Body>
        </therequestbodywas>
      </soapenv:Body>
    </soapenv:Envelope>

A more elaborate example
------------------------

Here we have a SOAP service that converts a fraction to a decimal value,
with pass-through of PostgreSQL errors to the SOAP response.
Please note that in production you probably should not pass through plain database errors
potentially disclosing internals to the client, but instead handle the errors directly.


.. code-block:: postgres

   -- helper function
   CREATE OR REPLACE FUNCTION _soap_envelope(body xml)
    RETURNS xml
    LANGUAGE sql
   AS $function$
     SELECT xmlelement(
       NAME "soapenv:Envelope",
       XMLATTRIBUTES('http://schemas.xmlsoap.org/soap/envelope/' AS "xmlns:soapenv"),
       xmlelement(NAME "soapenv:Header"),
       xmlelement(NAME "soapenv:Body", body)
     );
   $function$;

   -- helper function
   CREATE OR REPLACE FUNCTION _soap_exception(
     faultcode text,
     faultstring text
   )
    RETURNS xml
    LANGUAGE sql
   AS $function$
     SELECT _soap_envelope(
       xmlelement(NAME "soapenv:Fault",
         xmlelement(NAME "faultcode", faultcode),
         xmlelement(NAME "faultstring", faultstring)
       )
     );
   $function$;

   CREATE OR REPLACE FUNCTION fraction_to_decimal(xml)
    RETURNS "text/xml"
    LANGUAGE plpgsql
   AS $function$
   DECLARE
     nsarray CONSTANT text[][] := ARRAY[
       ARRAY['soapenv', 'http://schemas.xmlsoap.org/soap/envelope/']
     ];
     exc_msg text;
     exc_detail text;
     exc_hint text;
     exc_sqlstate text;
   BEGIN
     -- simulating a statement that results in an exception:
     RETURN _soap_envelope(xmlelement(
       NAME "decimalValue",
       (
         (xpath('/soapenv:Envelope/soapenv:Body/fraction/numerator/text()', $1, nsarray))[1]::text::int
         /
         (xpath('/soapenv:Envelope/soapenv:Body/fraction/denominator/text()', $1, nsarray))[1]::text::int
       )::text::xml
     ));
   EXCEPTION WHEN OTHERS THEN
     GET STACKED DIAGNOSTICS
       exc_msg := MESSAGE_TEXT,
       exc_detail := PG_EXCEPTION_DETAIL,
       exc_hint := PG_EXCEPTION_HINT,
       exc_sqlstate := RETURNED_SQLSTATE;
     RAISE WARNING USING
       MESSAGE = exc_msg,
       DETAIL = exc_detail,
       HINT = exc_hint;
     RETURN _soap_exception(faultcode => exc_sqlstate, faultstring => concat(exc_msg, ', DETAIL: ', exc_detail, ', HINT: ', exc_hint));
   END
   $function$;

Let's test the ``fraction_to_decimal`` service with illegal values:

.. code-block:: bash

    curl http://localhost:3000/rpc/fraction_to_decimal \
      --header 'Content-Type: text/xml' \
      --header 'Accept: text/xml' \
      --data-binary @- <<XML
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header/>
      <soapenv:Body>
        <fraction>
          <numerator>42</numerator>
          <denominator>0</denominator>
        </fraction>
      </soapenv:Body>
    </soapenv:Envelope>
    XML

The output should roughly look like:

.. code-block:: xml

   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
     <soapenv:Header/>
     <soapenv:Body>
       <soapenv:Fault>
         <faultcode>22012</faultcode>
         <faultstring>division by zero, DETAIL: , HINT: </faultstring>
       </soapenv:Fault>
     </soapenv:Body>
   </soapenv:Envelope>

References
----------

For more information concerning PostgREST, cf.

- :ref:`function_single_unnamed`
- :ref:`custom_media`. See :ref:`any_handler`, if you need to support an ``application/soap+xml`` media type or if you want to respond with XML without sending a media type.
- :ref:`Nginx reverse proxy <nginx>`

For SOAP reference, visit

- the specification at https://www.w3.org/TR/soap/
- shorter more practical advice is available at https://www.w3schools.com/xml/xml_soap.asp
