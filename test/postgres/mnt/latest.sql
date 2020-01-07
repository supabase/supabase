--
-- PostgreSQL database dump
--

-- Dumped from database version 11.2
-- Dumped by pg_dump version 11.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: supabase
--

CREATE TABLE public.companies (
    company_id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    employee_count smallint
);


ALTER TABLE public.companies OWNER TO supabase;

--
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase
--

CREATE SEQUENCE public.companies_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_company_id_seq OWNER TO supabase;

--
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: supabase
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_name character varying(255) NOT NULL,
    company_id integer NOT NULL
);


ALTER TABLE public.users OWNER TO supabase;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: supabase
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO supabase;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: supabase
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: supabase
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: supabase
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: supabase
--

COPY public.companies (company_id, company_name, employee_count) FROM stdin;
1	Pied Piper	10
2	Hooli	1000
3	Yao Net	100
4	See Food App	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: supabase
--

COPY public.users (user_id, user_name, company_id) FROM stdin;
1	Richard Hendrix	1
2	Gavin Belson	2
\.


--
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: supabase
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: supabase
--

SELECT pg_catalog.setval('public.users_user_id_seq', 2, true);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

