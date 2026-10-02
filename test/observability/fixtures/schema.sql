DROP SCHEMA IF EXISTS test;

CREATE SCHEMA test;

SET search_path = test, pg_catalog;

--
-- Name: authors_only; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE authors_only (
    owner character varying NOT NULL,
    secret character varying NOT NULL
);

--
-- Name: authors_only_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY authors_only
    ADD CONSTRAINT authors_only_pkey PRIMARY KEY (secret);
