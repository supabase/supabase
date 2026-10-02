--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5beta1
-- Dumped by pg_dump version 9.5beta1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = postgrest, pg_catalog;

--
-- Data for Name: auth; Type: TABLE DATA; Schema: postgrest; Owner: -
--

TRUNCATE TABLE auth CASCADE;
INSERT INTO auth VALUES ('jdoe', 'postgrest_test_author', '1234                                                        ');


SET search_path = private, pg_catalog;

--
-- Data for Name: articles; Type: TABLE DATA; Schema: private; Owner: -
--

TRUNCATE TABLE articles CASCADE;
INSERT INTO articles VALUES (1, 'No… It''s a thing; it''s like a plan, but with more greatness.', 'diogo');
INSERT INTO articles VALUES (2, 'Stop talking, brain thinking. Hush.', 'diogo');
INSERT INTO articles VALUES (3, 'It''s a fez. I wear a fez now. Fezes are cool.', 'diogo');


SET search_path = test, pg_catalog;

--
-- Data for Name: users; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE users CASCADE;
INSERT INTO users VALUES (1, 'Angela Martin');
INSERT INTO users VALUES (2, 'Michael Scott');
INSERT INTO users VALUES (3, 'Dwight Schrute');


SET search_path = private, pg_catalog;

--
-- Data for Name: article_stars; Type: TABLE DATA; Schema: private; Owner: -
--

TRUNCATE TABLE article_stars CASCADE;
INSERT INTO article_stars VALUES (1, 1, '2015-12-08 04:22:57.472738');
INSERT INTO article_stars VALUES (1, 2, '2015-12-08 04:22:57.472738');
INSERT INTO article_stars VALUES (2, 3, '2015-12-08 04:22:57.472738');
INSERT INTO article_stars VALUES (3, 2, '2015-12-08 04:22:57.472738');
INSERT INTO article_stars VALUES (1, 3, '2015-12-08 04:22:57.472738');


SET search_path = test, pg_catalog;

--
-- Data for Name: authors_only; Type: TABLE DATA; Schema: test; Owner: -
--
TRUNCATE TABLE authors_only CASCADE;


--
-- Data for Name: auto_incrementing_pk; Type: TABLE DATA; Schema: test; Owner: -
--
TRUNCATE TABLE auto_incrementing_pk CASCADE;


--
-- Name: auto_incrementing_pk_id_seq; Type: SEQUENCE SET; Schema: test; Owner: -
--

SELECT pg_catalog.setval('auto_incrementing_pk_id_seq', 1, true);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE clients CASCADE;
INSERT INTO clients VALUES (1, 'Microsoft');
INSERT INTO clients VALUES (2, 'Apple');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE projects CASCADE;
INSERT INTO projects VALUES (1, 'Windows 7', 1);
INSERT INTO projects VALUES (2, 'Windows 10', 1);
INSERT INTO projects VALUES (3, 'IOS', 2);
INSERT INTO projects VALUES (4, 'OSX', 2);
INSERT INTO projects VALUES (5, 'Orphan', NULL);


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE tasks CASCADE;
INSERT INTO tasks VALUES (1, 'Design w7', 1);
INSERT INTO tasks VALUES (2, 'Code w7', 1);
INSERT INTO tasks VALUES (3, 'Design w10', 2);
INSERT INTO tasks VALUES (4, 'Code w10', 2);
INSERT INTO tasks VALUES (5, 'Design IOS', 3);
INSERT INTO tasks VALUES (6, 'Code IOS', 3);
INSERT INTO tasks VALUES (7, 'Design OSX', 4);
INSERT INTO tasks VALUES (8, 'Code OSX', 4);


--
-- Data for Name: users_tasks; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE users_tasks CASCADE;
INSERT INTO users_tasks VALUES (1, 1);
INSERT INTO users_tasks VALUES (1, 2);
INSERT INTO users_tasks VALUES (1, 3);
INSERT INTO users_tasks VALUES (1, 4);
INSERT INTO users_tasks VALUES (2, 5);
INSERT INTO users_tasks VALUES (2, 6);
INSERT INTO users_tasks VALUES (2, 7);
INSERT INTO users_tasks VALUES (3, 1);
INSERT INTO users_tasks VALUES (3, 5);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE comments CASCADE;
INSERT INTO comments VALUES (1, 1, 2, 6, 'Needs to be delivered ASAP');

--
-- Data for Name: files; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE files CASCADE;
INSERT INTO files VALUES
	 (1, 'command.com', '#include <unix.h>')
	,(1, 'autoexec.bat', '@ECHO OFF')
	,(1, 'io.sys', 'TODO')
	,(2, 'README.md', '# make $$$!')
	,(2, 'marketing.key', '$-$')
	;

TRUNCATE TABLE touched_files CASCADE;
INSERT INTO touched_files VALUES
	 (1, 1, 1, 'command.com')
	,(1, 1, 1, 'autoexec.bat')
	,(1, 1, 2, 'README.md')
	,(3, 1, 1, 'autoexec.bat')
	;

--
-- Data for Name: complex_items; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE complex_items CASCADE;
INSERT INTO complex_items VALUES (1, 'One', '{"foo":{"int":1,"bar":"baz"}}', '{1}');
INSERT INTO complex_items VALUES (2, 'Two', '{"foo":{"int":1,"bar":"baz"}}', '{1,2}');
INSERT INTO complex_items VALUES (3, 'Three', '{"foo":{"int":1,"bar":"baz"}}', '{1,2,3}', 3);


--
-- Data for Name: compound_pk; Type: TABLE DATA; Schema: test; Owner: -
--
TRUNCATE TABLE compound_pk CASCADE;


--
-- Data for Name: simple_pk; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE simple_pk CASCADE;
INSERT INTO simple_pk VALUES ('xyyx', 'u');
INSERT INTO simple_pk VALUES ('xYYx', 'v');

--
-- Data for Name: has_fk; Type: TABLE DATA; Schema: test; Owner: -
--
TRUNCATE TABLE has_fk CASCADE;


--
-- Name: has_fk_id_seq; Type: SEQUENCE SET; Schema: test; Owner: -
--

SELECT pg_catalog.setval('has_fk_id_seq', 1, false);


--
-- Data for Name: items; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE items CASCADE;
INSERT INTO items VALUES (1);
INSERT INTO items VALUES (2);
INSERT INTO items VALUES (3);
INSERT INTO items VALUES (4);
INSERT INTO items VALUES (5);
INSERT INTO items VALUES (6);
INSERT INTO items VALUES (7);
INSERT INTO items VALUES (8);
INSERT INTO items VALUES (9);
INSERT INTO items VALUES (10);
INSERT INTO items VALUES (11);
INSERT INTO items VALUES (12);
INSERT INTO items VALUES (13);
INSERT INTO items VALUES (14);
INSERT INTO items VALUES (15);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: test; Owner: -
--

SELECT pg_catalog.setval('items_id_seq', 15, true);


--
-- Data for Name: items2; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE items2 CASCADE;
INSERT INTO items2 VALUES (1);
INSERT INTO items2 VALUES (2);
INSERT INTO items2 VALUES (3);
INSERT INTO items2 VALUES (4);
INSERT INTO items2 VALUES (5);
INSERT INTO items2 VALUES (6);
INSERT INTO items2 VALUES (7);
INSERT INTO items2 VALUES (8);
INSERT INTO items2 VALUES (9);
INSERT INTO items2 VALUES (10);
INSERT INTO items2 VALUES (11);
INSERT INTO items2 VALUES (12);
INSERT INTO items2 VALUES (13);
INSERT INTO items2 VALUES (14);
INSERT INTO items2 VALUES (15);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: test; Owner: -
--

SELECT pg_catalog.setval('items2_id_seq', 15, true);


--
-- Data for Name: json_table; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE json_table CASCADE;
INSERT INTO json_table VALUES ('{"foo":{"bar":"baz"},"id":1}');
INSERT INTO json_table VALUES ('{"id":3}');
INSERT INTO json_table VALUES ('{"id":0}');


--
-- Data for Name: menagerie; Type: TABLE DATA; Schema: test; Owner: -
--
TRUNCATE TABLE menagerie CASCADE;


--
-- Data for Name: no_pk; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE no_pk CASCADE;
INSERT INTO no_pk VALUES (NULL, NULL);
INSERT INTO no_pk VALUES ('1', '0');
INSERT INTO no_pk VALUES ('2', '0');


--
-- Data for Name: nullable_integer; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE nullable_integer CASCADE;
INSERT INTO nullable_integer VALUES (NULL);


--
-- Data for Name: tsearch; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE tsearch CASCADE;
INSERT INTO tsearch VALUES (to_tsvector('It''s kind of fun to do the impossible'));
INSERT INTO tsearch VALUES (to_tsvector('But also fun to do what is possible'));
INSERT INTO tsearch VALUES (to_tsvector('Fat cats ate rats'));
INSERT INTO tsearch VALUES (to_tsvector('french', 'C''est un peu amusant de faire l''impossible'));
INSERT INTO tsearch VALUES (to_tsvector('german', 'Es ist eine Art Spaß, das Unmögliche zu machen'));

--
-- Data for Name: users_projects; Type: TABLE DATA; Schema: test; Owner: -
--

TRUNCATE TABLE users_projects CASCADE;
INSERT INTO users_projects VALUES (1, 1);
INSERT INTO users_projects VALUES (1, 2);
INSERT INTO users_projects VALUES (2, 3);
INSERT INTO users_projects VALUES (2, 4);
INSERT INTO users_projects VALUES (3, 1);
INSERT INTO users_projects VALUES (3, 3);

TRUNCATE TABLE "Escap3e;" CASCADE;
INSERT INTO "Escap3e;" VALUES (1), (2), (3), (4), (5);

TRUNCATE TABLE "ghostBusters" CASCADE;
INSERT INTO "ghostBusters" VALUES (1), (3), (5);

TRUNCATE TABLE "withUnique" CASCADE;
INSERT INTO "withUnique" VALUES ('nodup', 'blah');



TRUNCATE TABLE addresses CASCADE;
INSERT INTO addresses VALUES (1, 'address 1');
INSERT INTO addresses VALUES (2, 'address 2');
INSERT INTO addresses VALUES (3, 'address 3');
INSERT INTO addresses VALUES (4, 'address 4');

TRUNCATE TABLE orders CASCADE;
INSERT INTO orders VALUES (1, 'order 1', 1, 2);
INSERT INTO orders VALUES (2, 'order 2', 3, 4);

TRUNCATE TABLE images CASCADE;
INSERT INTO images(name, img) VALUES ('A.png', decode('iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeAQMAAAAB/jzhAAAABlBMVEUAAAD/AAAb/40iAAAAP0lEQVQI12NgwAbYG2AE/wEYwQMiZB4ACQkQYZEAIgqAhAGIKLCAEQ8kgMT/P1CCEUwc4IMSzA3sUIIdCHECAGSQEkeOTUyCAAAAAElFTkSuQmCC', 'base64'));
INSERT INTO images(name, img) VALUES ('B.png', decode('iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeAQMAAAAB/jzhAAAABlBMVEX///8AAP94wDzzAAAAL0lEQVQIW2NgwAb+HwARH0DEDyDxwAZEyGAhLODqHmBRzAcn5GAS///A1IF14AAA5/Adbiiz/0gAAAAASUVORK5CYII=', 'base64'));

TRUNCATE TABLE w_or_wo_comma_names CASCADE;
INSERT INTO w_or_wo_comma_names VALUES ('Hebdon, John');
INSERT INTO w_or_wo_comma_names VALUES ('Williams, Mary');
INSERT INTO w_or_wo_comma_names VALUES ('Smith, Joseph');
INSERT INTO w_or_wo_comma_names VALUES ('David White');
INSERT INTO w_or_wo_comma_names VALUES ('Larry Thompson');
INSERT INTO w_or_wo_comma_names VALUES ('Double O Seven(007)');
INSERT INTO w_or_wo_comma_names VALUES ('"');
INSERT INTO w_or_wo_comma_names VALUES ('Double"Quote"McGraw"');
INSERT INTO w_or_wo_comma_names VALUES ('\');
INSERT INTO w_or_wo_comma_names VALUES ('/\Slash/\Beast/\');

TRUNCATE TABLE items_with_different_col_types CASCADE;
INSERT INTO items_with_different_col_types VALUES (1, null, null, null, null, null, null, null);

TRUNCATE TABLE entities CASCADE;
INSERT INTO entities VALUES (1, 'entity 1', '{1}', '''bar'':2 ''foo'':1');
INSERT INTO entities VALUES (2, 'entity 2', '{1,2}', '''baz'':1 ''qux'':2');
INSERT INTO entities VALUES (3, 'entity 3', '{1,2,3}', null);
INSERT INTO entities VALUES (4, null, null, null);

TRUNCATE TABLE child_entities CASCADE;
INSERT INTO child_entities VALUES (1, 'child entity 1', 1);
INSERT INTO child_entities VALUES (2, 'child entity 2', 1);
INSERT INTO child_entities VALUES (3, 'child entity 3', 2);
INSERT INTO child_entities VALUES (4, 'child entity 4', 1);
INSERT INTO child_entities VALUES (5, 'child entity 5', 1);
INSERT INTO child_entities VALUES (6, 'child entity 6', 2);

TRUNCATE TABLE grandchild_entities CASCADE;
INSERT INTO grandchild_entities VALUES (1, 'grandchild entity 1', 1, null, null, null);
INSERT INTO grandchild_entities VALUES (2, 'grandchild entity 2', 1, null, null, null);
INSERT INTO grandchild_entities VALUES (3, 'grandchild entity 3', 2, null, null, null);
INSERT INTO grandchild_entities VALUES (4, '(grandchild,entity,4)', 2, null, null, '{"a": {"b":"foo"}}');
INSERT INTO grandchild_entities VALUES (5, '(grandchild,entity,5)', 2, null, null, '{"b":"bar"}');

TRUNCATE TABLE ranges CASCADE;
INSERT INTO ranges VALUES (1, '[1,3]');
INSERT INTO ranges VALUES (2, '[3,6]');
INSERT INTO ranges VALUES (3, '[6,9]');
INSERT INTO ranges VALUES (4, '[9,12]');
INSERT INTO ranges VALUES (5, null);

TRUNCATE TABLE being CASCADE;
INSERT INTO being VALUES (1), (2), (3), (4);

TRUNCATE TABLE descendant CASCADE;
INSERT INTO descendant VALUES (1,1), (2,1), (3,1), (4,2);

TRUNCATE TABLE part CASCADE;
INSERT INTO part VALUES (1), (2), (3), (4);

TRUNCATE TABLE being_part CASCADE;
INSERT INTO being_part VALUES (1,1), (2,1), (3,2), (4,3);

TRUNCATE TABLE employees CASCADE;
INSERT INTO employees VALUES
  ('Frances M.', 'Roe', '24000', 'One-Up Realty', 'Author'),
  ('Daniel B.', 'Lyon', '36000', 'Dubrow''s Cafeteria', 'Packer'),
  ('Edwin S.', 'Smith', '48000', 'Pro Garden Management', 'Marine biologist');

TRUNCATE TABLE tiobe_pls CASCADE;
INSERT INTO tiobe_pls VALUES ('Java', 1), ('C', 2), ('Python', 4);

TRUNCATE TABLE single_unique CASCADE;
INSERT INTO single_unique (unique_key, value) VALUES (1, 'A');

TRUNCATE TABLE compound_unique CASCADE;
INSERT INTO compound_unique (key1, key2, value) VALUES (1, 1, 'A');

TRUNCATE TABLE only_pk CASCADE;
INSERT INTO only_pk VALUES (1), (2);

TRUNCATE TABLE family_tree CASCADE;
INSERT INTO family_tree VALUES ('1', 'Parental Unit', NULL);
INSERT INTO family_tree VALUES ('2', 'Kid One', '1');
INSERT INTO family_tree VALUES ('3', 'Kid Two', '1');
INSERT INTO family_tree VALUES ('4', 'Grandkid One', '2');
INSERT INTO family_tree VALUES ('5', 'Grandkid Two', '3');

TRUNCATE TABLE managers CASCADE;
INSERT INTO managers VALUES (1, 'Referee Manager');
INSERT INTO managers VALUES (2, 'Auditor Manager');
INSERT INTO managers VALUES (3, 'Acme Manager');
INSERT INTO managers VALUES (4, 'Umbrella Manager');
INSERT INTO managers VALUES (5, 'Cyberdyne Manager');
INSERT INTO managers VALUES (6, 'Oscorp Manager');

TRUNCATE TABLE organizations CASCADE;
INSERT INTO organizations VALUES (1, 'Referee Org', null, null, 1);
INSERT INTO organizations VALUES (2, 'Auditor Org', null, null, 2);
INSERT INTO organizations VALUES (3, 'Acme', 1, 2, 3);
INSERT INTO organizations VALUES (4, 'Umbrella', 1, 2, 4);
INSERT INTO organizations VALUES (5, 'Cyberdyne', 3, 4, 5);
INSERT INTO organizations VALUES (6, 'Oscorp', 3, 4, 6);

SET search_path = private, pg_catalog;

TRUNCATE TABLE authors CASCADE;
INSERT INTO authors VALUES (1, 'George Orwell');
INSERT INTO authors VALUES (2, 'Anne Frank');
INSERT INTO authors VALUES (3, 'Antoine de Saint-Exupéry');
INSERT INTO authors VALUES (4, 'J.D. Salinger');
INSERT INTO authors VALUES (5, 'Ray Bradbury');
INSERT INTO authors VALUES (6, 'William Golding');
INSERT INTO authors VALUES (7, 'Harper Lee');
INSERT INTO authors VALUES (8, 'Kurt Vonnegut');
INSERT INTO authors VALUES (9, 'Ken Kesey');
INSERT INTO authors VALUES (10, 'Fyodor Dostoevsky');

TRUNCATE TABLE publishers CASCADE;
INSERT INTO publishers VALUES (1, 'Secker & Warburg');
INSERT INTO publishers VALUES (2, 'Contact Publishing');
INSERT INTO publishers VALUES (3, 'Reynal & Hitchcock');
INSERT INTO publishers VALUES (4, 'Little, Brown and Company');
INSERT INTO publishers VALUES (5, 'Ballantine Books');
INSERT INTO publishers VALUES (6, 'Faber and Faber');
INSERT INTO publishers VALUES (7, 'J. B. Lippincott & Co.');
INSERT INTO publishers VALUES (8, 'Delacorte');
INSERT INTO publishers VALUES (9, 'Viking Press & Signet Books');

TRUNCATE TABLE books CASCADE;
INSERT INTO books VALUES (1, '1984', 1949, 1, 1);
INSERT INTO books VALUES (2, 'The Diary of a Young Girl', 1947, 2, 2);
INSERT INTO books VALUES (3, 'The Little Prince', 1947, 3, 3);
INSERT INTO books VALUES (4, 'The Catcher in the Rye', 1951, 4, 4);
INSERT INTO books VALUES (5, 'Farenheit 451', 1953, 5, 5);
INSERT INTO books VALUES (6, 'Lord of the Flies', 1954, 6, 6);
INSERT INTO books VALUES (7, 'To Kill a Mockingbird', 1960, 7, 7);
INSERT INTO books VALUES (8, 'Slaughterhouse-Five', 1969, 8, 8);
INSERT INTO books VALUES (9, 'One Flew Over the Cuckoo''s Nest', 1962, 9, 9);
INSERT INTO books VALUES (10, 'Crime and Punishment', 1866, 10, null);

SET search_path = test, pg_catalog;

TRUNCATE TABLE person CASCADE;

INSERT INTO person VALUES (1, 'John');
INSERT INTO person VALUES (2, 'Jane');
INSERT INTO person VALUES (3, 'Jake');
INSERT INTO person VALUES (4, 'Julie');

TRUNCATE TABLE message CASCADE;
INSERT INTO message VALUES (1, 'Hello Jane', 1, 2);
INSERT INTO message VALUES (2, 'Hi John', 2, 1);
INSERT INTO message VALUES (3, 'How are you doing?', 1, 2);
INSERT INTO message VALUES (4, 'Hey Julie', 3, 4);
INSERT INTO message VALUES (5, 'What''s up Jake', 4, 3);

TRUNCATE TABLE space CASCADE;
INSERT INTO space VALUES (1, 'space 1');

TRUNCATE TABLE zone CASCADE;
INSERT INTO zone VALUES (1, 'zone 1', 2, 1);
INSERT INTO zone VALUES (2, 'zone 2', 2, 1);
INSERT INTO zone VALUES (3, 'store 3', 3, 1);
INSERT INTO zone VALUES (4, 'store 4', 3, 1);

-- for foreign table projects_dump
copy (select id, name, client_id from projects) to '/tmp/projects_dump.csv' with csv;

TRUNCATE TABLE "UnitTest" CASCADE;
INSERT INTO "UnitTest" VALUES (1, 'unit test 1');

TRUNCATE TABLE json_arr CASCADE;
INSERT INTO json_arr VALUES (1, '[1, 2, 3]');
INSERT INTO json_arr VALUES (2, '[4, 5, 6]');
INSERT INTO json_arr VALUES (3, '[[9, 8, 7], [11, 12, 13]]');
INSERT INTO json_arr VALUES (4, '[[[5, 6], 7, 8]]');
INSERT INTO json_arr VALUES (5, '[{"a": "A"}, {"b": "B"}]');
INSERT INTO json_arr VALUES (6, '[{"a": [1,2,3]}, {"b": [4,5]}]');
INSERT INTO json_arr VALUES (7, '{"c": [1,2,3], "d": [4,5]}');
INSERT INTO json_arr VALUES (8, '{"c": [{"d": [4,5,6,7,8]}]}');
INSERT INTO json_arr VALUES (9, '[{"0xy1": [1,{"23-xy-45": [2, {"xy-6": [3]}]}]}]');
INSERT INTO json_arr VALUES (10, '{"!@#$%^&*_a": [{"!@#$%^&*_b": 1}, {"!@#$%^&*_c": [2]}], "!@#$%^&*_d": {"!@#$%^&*_e": 3}}');

TRUNCATE TABLE jsonb_test CASCADE;
INSERT INTO jsonb_test VALUES (1, '{ "a": {"b": 2} }');
INSERT INTO jsonb_test VALUES (2, '{ "c": [1,2,3] }');
INSERT INTO jsonb_test VALUES (3, '[{ "d": "test" }]');
INSERT INTO jsonb_test VALUES (4, '{ "e": 1 }');

TRUNCATE TABLE private.player CASCADE;
INSERT into private.player
SELECT
  generate_series,
  'first_name_' || generate_series,
  'last_name_' || generate_series,
  '2018-10-11'
FROM generate_series(1, 12);

TRUNCATE TABLE contract CASCADE;
insert into contract
select
  'tournament_' || generate_series,
  tsrange(now()::timestamp, null),
  10*generate_series,
  generate_series,
  'first_name_' || generate_series,
  'last_name_' || generate_series,
  '2018-10-11'
from generate_series(1, 6);

TRUNCATE TABLE ltree_sample CASCADE;
INSERT INTO ltree_sample VALUES ('Top');
INSERT INTO ltree_sample VALUES ('Top.Science');
INSERT INTO ltree_sample VALUES ('Top.Science.Astronomy');
INSERT INTO ltree_sample VALUES ('Top.Science.Astronomy.Astrophysics');
INSERT INTO ltree_sample VALUES ('Top.Science.Astronomy.Cosmology');
INSERT INTO ltree_sample VALUES ('Top.Hobbies');
INSERT INTO ltree_sample VALUES ('Top.Hobbies.Amateurs_Astronomy');
INSERT INTO ltree_sample VALUES ('Top.Collections');
INSERT INTO ltree_sample VALUES ('Top.Collections.Pictures');
INSERT INTO ltree_sample VALUES ('Top.Collections.Pictures.Astronomy');
INSERT INTO ltree_sample VALUES ('Top.Collections.Pictures.Astronomy.Stars');
INSERT INTO ltree_sample VALUES ('Top.Collections.Pictures.Astronomy.Galaxies');
INSERT INTO ltree_sample VALUES ('Top.Collections.Pictures.Astronomy.Astronauts');

TRUNCATE TABLE isn_sample CASCADE;
INSERT INTO isn_sample VALUES ('978-0-393-04002-9', 'Mathematics: From the Birth of Numbers');

TRUNCATE TABLE "Server Today" CASCADE;
COPY "Server Today" ("cHostname", "Just A Server Model") FROM STDIN CSV DELIMITER '|';
argnim1    | IBM,9113-550 (P5-550)
argnim2    | IBM,9113-550 (P5-550)
daaa2nim71 | IBM,9131-52A (P5-52A)
daah3nim71 | IBM,8406-71Y (P7-PS701)
hbnim1     | IBM,9133-55A (P5-55A)
\.

TRUNCATE TABLE pgrst_reserved_chars CASCADE;
COPY pgrst_reserved_chars ("*id*", ":arr->ow::cast", "(inside,parens)", "a.dotted.column", "  col  w  space  ") FROM STDIN CSV DELIMITER '|';
1 | arrow-1 | parens-1 | dotted-1 | space-1
2 | arrow-2 | parens-2 | dotted-2 | space-2
3 | arrow-3 | parens-3 | dotted-3 | space-3
\.

TRUNCATE TABLE web_content CASCADE;
INSERT INTO web_content VALUES (5, 'wat', null);
INSERT INTO web_content VALUES (0, 'tardis', 5);
INSERT INTO web_content VALUES (1, 'fezz', 0);
INSERT INTO web_content VALUES (2, 'foo', 0);
INSERT INTO web_content VALUES (3, 'bar', 0);
INSERT INTO web_content VALUES (4, 'wut', 1);

TRUNCATE TABLE app_users CASCADE;
INSERT INTO app_users (id, email, "password") VALUES (1, 'test@123.com','pass');
INSERT INTO app_users (id, email, "password") VALUES (2, 'abc@123.com','pass');
INSERT INTO app_users (id, email, "password") VALUES (3, 'def@123.com','pass');

TRUNCATE TABLE private.pages CASCADE;
INSERT INTO private.pages VALUES (1, 'http://postgrest.org/en/v6.0/api.html');
INSERT INTO private.pages VALUES (2, 'http://postgrest.org/en/v6.0/admin.html');

TRUNCATE TABLE private.referrals CASCADE;
INSERT INTO private.referrals VALUES ('github.com', 1);
INSERT INTO private.referrals VALUES ('hub.docker.com', 2);

TRUNCATE TABLE big_projects CASCADE;
INSERT INTO big_projects (big_project_id, name)
VALUES (1, 'big project 1'),
       (2, 'big project 2');

TRUNCATE TABLE sites CASCADE;
INSERT INTO sites (site_id, name, main_project_id)
VALUES (1, 'site 1', 1),
       (2, 'site 2', null),
       (3, 'site 3', 2),
       (4, 'site 4', null);

TRUNCATE TABLE jobs CASCADE;
INSERT INTO jobs (job_id, name, site_id, big_project_id)
VALUES ('bc5d5362-b881-438f-b9f5-7417e08704ed', 'job 1-1', 1, 1),
       ('3bd52697-033b-4edd-8a28-46a9c04b7c1e', 'job 2-1', 2, 1),
       ('e6e67e4e-19b1-11e9-ab14-d663bd873d93', 'job 2-2', 2, 2);

TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE agents CASCADE;
INSERT INTO agents (id, name)
VALUES (1, 'agent 1'),
       (2, 'agent 2'),
       (3, 'agent 3'),
       (4, 'agent 4');

INSERT INTO departments (id, name, head_id)
VALUES (1, 'dep 1', 1),
       (2, 'dep 3', 3);

UPDATE agents SET department_id = 1 WHERE id in (1, 2);
UPDATE agents SET department_id = 2 WHERE id in (3, 4);

TRUNCATE TABLE schedules CASCADE;
INSERT INTO schedules VALUES(1, 'morning', '06:00:00', '11:59:00');
INSERT INTO schedules VALUES(2, 'afternoon', '12:00:00', '17:59:00');
INSERT INTO schedules VALUES(3, 'night', '18:00:00', '23:59:00');
INSERT INTO schedules VALUES(4, 'early morning', '00:00:00', '05:59:00');

TRUNCATE TABLE activities CASCADE;
INSERT INTO activities(id, schedule_id, car_id)    VALUES(1, 1, 'CAR-349');
INSERT INTO activities(id, schedule_id, camera_id) VALUES(2, 3, 'CAM-123');

TRUNCATE TABLE unit_workdays CASCADE;
INSERT INTO unit_workdays VALUES(1, '2019-12-02', 1, 1, 2, 3);

TRUNCATE TABLE v1.parents CASCADE;
INSERT INTO v1.parents VALUES(1, 'parent v1-1'), (2, 'parent v1-2');

TRUNCATE TABLE v1.children CASCADE;
INSERT INTO v1.children VALUES(1, 'child v1-1', 1), (2, 'child v1-2', 2);

TRUNCATE TABLE v2.parents CASCADE;
INSERT INTO v2.parents VALUES(3, 'parent v2-3'), (4, 'parent v2-4');

TRUNCATE TABLE v2.children CASCADE;
INSERT INTO v2.children VALUES(1, 'child v2-3', 3);

TRUNCATE TABLE v2.another_table CASCADE;
INSERT INTO v2.another_table VALUES(5, 'value 5'), (6, 'value 6');

TRUNCATE TABLE private.stuff CASCADE;
INSERT INTO private.stuff (id, name) VALUES (1, 'stuff 1');

TRUNCATE TABLE private.screens CASCADE;
INSERT INTO private.screens(name) VALUES ('banana'), ('helicopter'), ('formula 1 banana');

INSERT INTO private.labels(name) VALUES ('vehicles'), ('fruit');

INSERT INTO private.label_screen(label_id, screen_id) VALUES
    ((SELECT id FROM labels WHERE name='vehicles'), (SELECT id FROM screens WHERE name='helicopter')),
    ((SELECT id FROM labels WHERE name='vehicles'), (SELECT id FROM screens WHERE name='formula 1 banana')),
    ((SELECT id FROM labels WHERE name='fruit'), (SELECT id FROM screens WHERE name='banana')),
    ((SELECT id FROM labels WHERE name='fruit'), (SELECT id FROM screens WHERE name='formula 1 banana'));

TRUNCATE TABLE private.actors CASCADE;
INSERT INTO private.actors (id, name) VALUES (1,'john'), (2,'mary');

TRUNCATE TABLE private.films CASCADE;
INSERT INTO private.films (id, title) VALUES (12,'douze commandements'), (2001,'odyssée de l''espace');

TRUNCATE TABLE private.personnages CASCADE;
INSERT INTO private.personnages (film_id, role_id, character) VALUES (12,1,'méchant'), (2001,2,'astronaute');

INSERT INTO test.car_models(name, year) VALUES ('DeLorean',1981);
INSERT INTO test.car_models(name, year) VALUES ('F310-B',1997);
INSERT INTO test.car_models(name, year) VALUES ('Veneno',2013);
INSERT INTO test.car_models(name, year) VALUES ('Murcielago',2001);

INSERT INTO test.car_brands(name) VALUES ('DMC');
INSERT INTO test.car_brands(name) VALUES ('Ferrari');
INSERT INTO test.car_brands(name) VALUES ('Lamborghini');

UPDATE test.car_models SET car_brand_name = 'DMC' WHERE name = 'DeLorean';
UPDATE test.car_models SET car_brand_name = 'Ferrari' WHERE name = 'F310-B';
UPDATE test.car_models SET car_brand_name = 'Lamborghini' WHERE name = 'Veneno';
UPDATE test.car_models SET car_brand_name = 'Lamborghini' WHERE name = 'Murcielago';

INSERT INTO test.car_model_sales(date, quantity, car_model_name, car_model_year) VALUES ('2021-01-14',7,'DeLorean',1981);
INSERT INTO test.car_model_sales(date, quantity, car_model_name, car_model_year) VALUES ('2021-01-15',9,'DeLorean',1981);
INSERT INTO test.car_model_sales(date, quantity, car_model_name, car_model_year) VALUES ('2021-02-11',1,'Murcielago',2001);
INSERT INTO test.car_model_sales(date, quantity, car_model_name, car_model_year) VALUES ('2021-02-12',3,'Murcielago',2001);

INSERT INTO test.car_racers(name) VALUES ('Alain Prost');
INSERT INTO test.car_racers(name, car_model_name, car_model_year) VALUES ('Michael Schumacher', 'F310-B', 1997);

INSERT INTO test.car_dealers(name,city) VALUES ('Springfield Cars S.A.','Springfield');
INSERT INTO test.car_dealers(name,city) VALUES ('The Best Deals S.A.','Franklin');

INSERT INTO test.car_models_car_dealers(car_model_name, car_model_year, car_dealer_name, car_dealer_city, quantity) VALUES ('DeLorean',1981,'Springfield Cars S.A.','Springfield',15);
INSERT INTO test.car_models_car_dealers(car_model_name, car_model_year, car_dealer_name, car_dealer_city, quantity) VALUES ('Murcielago',2001,'The Best Deals S.A.','Franklin',2);

TRUNCATE TABLE test.products CASCADE;
INSERT INTO test.products (id, name) VALUES (1,'product-1'), (2,'product-2'), (3,'product-3');

TRUNCATE TABLE test.suppliers CASCADE;
INSERT INTO test.suppliers (id, name) VALUES (1,'supplier-1'), (2,'supplier-2'), (3, 'supplier-3');

TRUNCATE TABLE test.products_suppliers CASCADE;
INSERT INTO test.products_suppliers (product_id, supplier_id) VALUES (1,1), (1,2), (2,1), (2,3);

TRUNCATE TABLE test.trade_unions CASCADE;
INSERT INTO test.trade_unions (id, name) VALUES (1,'union-1'), (2,'union-2'), (3, 'union-3'), (4, 'union-4');

TRUNCATE TABLE test.suppliers_trade_unions CASCADE;
INSERT INTO test.suppliers_trade_unions (supplier_id, trade_union_id) VALUES (1,1), (1,2), (2,3), (2,4);

TRUNCATE TABLE test.client CASCADE;
INSERT INTO test.client (id,name) values (1,'Walmart'),(2,'Target'),(3,'Big Lots');

TRUNCATE TABLE test.contact CASCADE;
INSERT INTO test.contact (id,name, clientid) values (1,'Wally Walton',1),(2,'Wilma Wellers',1),(3,'Tabby Targo',2),(4,'Bobby Bots',3),(5,'Bonnie Bits',3),(6,'Billy Boats',3) returning *;

TRUNCATE TABLE test.clientinfo CASCADE;
INSERT INTO test.clientinfo (id,clientid, other) values (1,1,'123 Main St'),(2,2,'456 South 3rd St'),(3,3,'789 Palm Tree Ln');

TRUNCATE TABLE test.chores CASCADE;
INSERT INTO test.chores (id, name, done) values (1, 'take out the garbage', true), (2, 'do the laundry', false), (3, 'wash the dishes', null);

TRUNCATE TABLE test.fav_numbers CASCADE;
INSERT INTO test.fav_numbers VALUES (ROW(0.5, 0.5), 'A'),  (ROW(0.6, 0.6), 'B');

TRUNCATE TABLE test.arrays CASCADE;
INSERT INTO test.arrays VALUES (0, '{1,2,3}', '{{1,2,3},{4,5,6},{7,8,9}}'), (1, '{11,12,13}', '{{11,12,13},{14,15,16},{17,18,19}}');

TRUNCATE TABLE test.xmltest CASCADE;
INSERT INTO test.xmltest VALUES
(1, '<myxml>foo</myxml>'),
(2, 'bar'),
(3, '<foobar><baz/></foobar>');

TRUNCATE TABLE test.oid_test CASCADE;
INSERT INTO oid_test(id, oid_col, oid_array_col) VALUES (1, '12345', '{1,2,3,4,5}'::oid[]);

TRUNCATE TABLE private.internal_job CASCADE;
INSERT INTO private.internal_job (id, parent_id) VALUES (1, null);
INSERT INTO private.internal_job (id, parent_id) VALUES (2, 1);

TRUNCATE TABLE test.test CASCADE;
INSERT INTO test.test (id, parent_id) VALUES (1, null), (2, 1);

TRUNCATE TABLE shops CASCADE;
INSERT INTO shops(id, address, shop_geom) VALUES(1, '1369 Cambridge St', 'SRID=4326;POINT(-71.10044 42.373695)');
INSERT INTO shops(id, address, shop_geom) VALUES(2, '757 Massachusetts Ave', 'SRID=4326;POINT(-71.10543 42.366432)');
INSERT INTO shops(id, address, shop_geom) VALUES(3, '605 W Kendall St', 'SRID=4326;POINT(-71.081924 42.36437)');

TRUNCATE TABLE shop_bles CASCADE;
INSERT INTO shop_bles(id, name, coords, shop_id, range_area) VALUES(1, 'Beacon-1', 'SRID=4326;POINT(-71.10044 42.373695)', 1,
  extensions.ST_GeomFromGeoJSON('{"type": "Polygon", "coordinates": [ [ [ -71.10045254230499, 42.37387083326593 ], [ -71.10048070549963, 42.37377126199953 ], [ -71.10039688646793, 42.37375838212269 ], [ -71.10037006437777, 42.37385844878863 ], [ -71.10045254230499, 42.37387083326593 ] ] ]}'));
INSERT INTO shop_bles(id, name, coords, shop_id, range_area) VALUES(2, 'Beacon-2', 'SRID=4326;POINT(-71.10044 42.373695)', 1,
  extensions.ST_GeomFromGeoJSON('{"type": "Polygon", "coordinates": [ [ [ -71.10034391283989, 42.37385299961788 ], [ -71.10036939382553, 42.373756895982865 ], [ -71.1002916097641, 42.373745997623224 ], [ -71.1002641171217, 42.37384408279195 ], [ -71.10034391283989, 42.37385299961788 ] ] ]}'));

TRUNCATE TABLE "SPECIAL ""@/\#~_-".languages CASCADE;
INSERT INTO "SPECIAL ""@/\#~_-".languages (id, name) VALUES (1, 'English'), (2, 'Spanish');
TRUNCATE TABLE "SPECIAL ""@/\#~_-".names CASCADE;
INSERT INTO "SPECIAL ""@/\#~_-".names (id, name, language_id) VALUES (1, 'John', 1), (2, 'Mary', 1), (3, 'José', 2);

TRUNCATE TABLE do$llar$s CASCADE;
INSERT INTO do$llar$s (a$num$) VALUES (100), (200), (300);

TRUNCATE TABLE safe_update_items CASCADE;
INSERT INTO safe_update_items(id, name, observation) VALUES (1, 'item-1', NULL), (2, 'item-2', NULL), (3, 'item-3', NULL);
TRUNCATE TABLE safe_delete_items CASCADE;
INSERT INTO safe_delete_items(id, name, observation) VALUES (1, 'item-1', NULL), (2, 'item-2', NULL), (3, 'item-3', NULL);
TRUNCATE TABLE unsafe_update_items CASCADE;
INSERT INTO unsafe_update_items(id, name, observation) VALUES (1, 'item-1', NULL), (2, 'item-2', NULL), (3, 'item-3', NULL);
TRUNCATE TABLE unsafe_delete_items CASCADE;
INSERT INTO unsafe_delete_items(id, name, observation) VALUES (1, 'item-1', NULL), (2, 'item-2', NULL), (3, 'item-3', NULL);

TRUNCATE TABLE designers CASCADE;
INSERT INTO designers(id, name) VALUES (1, 'Sid Meier'), (2, 'Hironobu Sakaguchi');

TRUNCATE TABLE videogames CASCADE;
INSERT INTO videogames(id, name, designer_id) VALUES (1, 'Civilization I', 1), (2, 'Civilization II', 1), (3, 'Final Fantasy I', 2), (4, 'Final Fantasy II', 2);

TRUNCATE TABLE students CASCADE;
INSERT INTO students(id, code, name) VALUES (1, '0001', 'John Doe'), (2, '0002', 'Jane Doe');

TRUNCATE TABLE students_info CASCADE;
INSERT INTO students_info(id, code, address) VALUES (1, '0001', 'Street 1'), (2, '0002', 'Street 2');

TRUNCATE TABLE country CASCADE;
INSERT INTO country(id, name) VALUES (1, 'Afghanistan'), (2, 'Algeria');

TRUNCATE TABLE capital CASCADE;
INSERT INTO capital(id, name, country_id) VALUES (1, 'Kabul', 1), (2, 'Algiers', 2);

TRUNCATE TABLE trash CASCADE;
INSERT INTO trash(id) VALUES (1), (2), (3);

TRUNCATE TABLE trash_details CASCADE;
INSERT INTO trash_details(id,jsonb_col) VALUES (1,'{"key": 10}'), (2,'{"key": 6}'), (3,'{"key": 8}');

TRUNCATE TABLE posters CASCADE;
INSERT INTO posters(id,name) VALUES (1,'Mark'), (2,'Elon'), (3,'Bill'), (4,'Jeff');

TRUNCATE TABLE subscriptions CASCADE;
INSERT INTO subscriptions(subscriber,subscribed) VALUES (3,1), (4,1), (1,2);

TRUNCATE TABLE datarep_todos CASCADE;
INSERT INTO datarep_todos VALUES (1, 'Report', 0, '2018-01-02', '\x89504e470d0a1a0a0000000d4948445200000001000000010100000000376ef924000000001049444154789c62600100000000ffff03000000060005057bfabd400000000049454e44ae426082', '2017-12-14 01:02:30', 12.50); -- smallest possible PNG
INSERT INTO datarep_todos VALUES (2, 'Essay', 256, '2018-01-03', NULL, '2017-12-14 01:02:30', 100000000000000.13); -- a number which can't be represented by a 64-bit float
INSERT INTO datarep_todos VALUES (3, 'Algebra', 123456, '2018-01-01 14:12:34.123456');
INSERT INTO datarep_todos VALUES (4, 'Opus Magnum', NULL, NULL);

TRUNCATE TABLE datarep_next_two_todos CASCADE;
INSERT INTO datarep_next_two_todos VALUES (1, 2, 3, 'school related');
INSERT INTO datarep_next_two_todos VALUES (2, 1, 3, 'do these first');

TRUNCATE TABLE bitchar_with_length CASCADE;
INSERT INTO bitchar_with_length(bit, char) VALUES ('00000', 'aaaaa');
INSERT INTO bitchar_with_length(bit, char) VALUES ('11111', 'bbbbb');

TRUNCATE TABLE table_a CASCADE;
INSERT INTO table_a(id, name) VALUES (1, 'Not null 1'), (2, null), (3, 'Not null 2');
TRUNCATE TABLE table_b CASCADE;
INSERT INTO table_b(table_a_id, name) VALUES (1, 'Test 1'), (2, 'Test 2'), (null, 'Test 3');

TRUNCATE TABLE lines CASCADE;
insert into lines values (1, 'line-1', 'LINESTRING(1 1,5 5)'::extensions.geometry), (2, 'line-2', 'LINESTRING(2 2,6 6)'::extensions.geometry);

TRUNCATE TABLE timestamps CASCADE;
INSERT INTO timestamps VALUES ('2023-10-18 12:37:59.611000+0000');
INSERT INTO timestamps VALUES ('2023-10-18 14:37:59.611000+0000');
INSERT INTO timestamps VALUES ('2023-10-18 16:37:59.611000+0000');

TRUNCATE TABLE project_invoices CASCADE;
INSERT INTO project_invoices VALUES (1, 100, 1);
INSERT INTO project_invoices VALUES (2, 200, 1);
INSERT INTO project_invoices VALUES (3, 500, 2);
INSERT INTO project_invoices VALUES (4, 700, 2);
INSERT INTO project_invoices VALUES (5, 1200, 3);
INSERT INTO project_invoices VALUES (6, 2000, 3);
INSERT INTO project_invoices VALUES (7, 100, 4);
INSERT INTO project_invoices VALUES (8, 4000, 4);

TRUNCATE TABLE budget_categories CASCADE;
INSERT INTO budget_categories VALUES (1, 'Beanie Babies', 'Brian Smith', 1000.31);
INSERT INTO budget_categories VALUES (2, 'DVDs', 'Jane Clarkson', 2000.12);
INSERT INTO budget_categories VALUES (3, 'Pizza', 'Brian Smith', 1000.11);
INSERT INTO budget_categories VALUES (4, 'Opera Tickets', 'Jane Clarkson', 7000.41);
INSERT INTO budget_categories VALUES (5, 'Nuclear Fusion Research', 'Sally Hughes', 500.23);
INSERT INTO budget_categories VALUES (6, 'T-5hirts', 'Dana de Groot', 500.33);

TRUNCATE TABLE budget_expenses CASCADE;
INSERT INTO budget_expenses VALUES (1, 200.26, 1);
INSERT INTO budget_expenses VALUES (2, 400.26, 3);
INSERT INTO budget_expenses VALUES (3, 100.22, 4);
INSERT INTO budget_expenses VALUES (5, 900.27, 5);

TRUNCATE TABLE factories CASCADE;
INSERT INTO factories VALUES (1, 'Factory A');
INSERT INTO factories VALUES (2, 'Factory B');
INSERT INTO factories VALUES (3, 'Factory C');
INSERT INTO factories VALUES (4, 'Factory D');

TRUNCATE TABLE process_categories CASCADE;
INSERT INTO process_categories VALUES (1, 'Batch');
INSERT INTO process_categories VALUES (2, 'Mass');

TRUNCATE TABLE processes CASCADE;
INSERT INTO processes VALUES (1, 'Process A1', 1, 1);
INSERT INTO processes VALUES (2, 'Process A2', 1, 2);
INSERT INTO processes VALUES (3, 'Process B1', 2, 1);
INSERT INTO processes VALUES (4, 'Process B2', 2, 1);
INSERT INTO processes VALUES (5, 'Process C1', 3, 2);
INSERT INTO processes VALUES (6, 'Process C2', 3, 2);
INSERT INTO processes VALUES (7, 'Process XX', 3, 2);
INSERT INTO processes VALUES (8, 'Process YY', 3, 2);

TRUNCATE TABLE process_costs CASCADE;
INSERT INTO process_costs VALUES (1, 150.00);
INSERT INTO process_costs VALUES (2, 200.00);
INSERT INTO process_costs VALUES (3, 180.00);
INSERT INTO process_costs VALUES (4, 70.00);
INSERT INTO process_costs VALUES (5, 40.00);
INSERT INTO process_costs VALUES (6, 70.00);
INSERT INTO process_costs VALUES (8, 40.00);

TRUNCATE TABLE supervisors CASCADE;
INSERT INTO supervisors VALUES (1, 'Mary');
INSERT INTO supervisors VALUES (2, 'John');
INSERT INTO supervisors VALUES (3, 'Peter');
INSERT INTO supervisors VALUES (4, 'Sarah');
INSERT INTO supervisors VALUES (5, 'Jane');

TRUNCATE TABLE process_supervisor CASCADE;
INSERT INTO process_supervisor VALUES (1, 1);
INSERT INTO process_supervisor VALUES (2, 2);
INSERT INTO process_supervisor VALUES (3, 3);
INSERT INTO process_supervisor VALUES (3, 4);
INSERT INTO process_supervisor VALUES (4, 1);
INSERT INTO process_supervisor VALUES (4, 2);
INSERT INTO process_supervisor VALUES (5, 3);
INSERT INTO process_supervisor VALUES (6, 3);

TRUNCATE TABLE operators CASCADE;
INSERT INTO operators VALUES (1, 'Anne', '{"id": "543210", "afk": true}');
INSERT INTO operators VALUES (2, 'Louis', '{"id": "012345"}');
INSERT INTO operators VALUES (3, 'Jeff', '{"id": "666666", "afk": true}');
INSERT INTO operators VALUES (4, 'Liz', '{"id": "999999"}');
INSERT INTO operators VALUES (5, 'Alfred', '{"id": "000000"}');

TRUNCATE TABLE process_operator CASCADE;
INSERT INTO process_operator VALUES (1,1);
INSERT INTO process_operator VALUES (1,2);
INSERT INTO process_operator VALUES (2,1);
INSERT INTO process_operator VALUES (2,2);
INSERT INTO process_operator VALUES (2,3);
INSERT INTO process_operator VALUES (3,3);
INSERT INTO process_operator VALUES (4,1);
INSERT INTO process_operator VALUES (4,3);
INSERT INTO process_operator VALUES (6,3);
INSERT INTO process_operator VALUES (6,5);
INSERT INTO process_operator VALUES (7,5);

TRUNCATE TABLE factory_buildings CASCADE;
INSERT INTO factory_buildings VALUES (1, 'A001', 150, 'A', 1, '{"ins": "2024C", "pending": true}');
INSERT INTO factory_buildings VALUES (2, 'A002', 200, 'A', 1, '{"ins": "2025A", "pending": true}');
INSERT INTO factory_buildings VALUES (3, 'B001', 50, 'B', 2, '{"ins": "2025A", "pending": true}');
INSERT INTO factory_buildings VALUES (4, 'B002', 120, 'C', 2, '{"ins": "2023A"}');
INSERT INTO factory_buildings VALUES (5, 'C001', 240, 'B', 3, '{"ins": "2022B"}' );
INSERT INTO factory_buildings VALUES (6, 'D001', 310, 'A', 4, '{"ins": "2024C", "pending": true}');

TRUNCATE TABLE surr_serial_upsert CASCADE;
INSERT INTO surr_serial_upsert(name, extra) VALUES ('value', 'existing value');

TRUNCATE TABLE surr_gen_default_upsert CASCADE;
INSERT INTO surr_gen_default_upsert(name, extra) VALUES ('value', 'existing value');

TRUNCATE TABLE "Surr_Gen_Default_Upsert" CASCADE;
INSERT INTO "Surr_Gen_Default_Upsert"(name, extra) VALUES ('value cs', 'existing value cs');

TRUNCATE TABLE tsearch_to_tsvector CASCADE;
INSERT INTO tsearch_to_tsvector(text_search) VALUES ('It''s kind of fun to do the impossible');
INSERT INTO tsearch_to_tsvector(text_search) VALUES ('But also fun to do what is possible');
INSERT INTO tsearch_to_tsvector(text_search) VALUES ('Fat cats ate rats');
INSERT INTO tsearch_to_tsvector(text_search) VALUES ('C''est un peu amusant de faire l''impossible');
INSERT INTO tsearch_to_tsvector(text_search) VALUES ('Es ist eine Art Spaß, das Unmögliche zu machen');

UPDATE tsearch_to_tsvector SET jsonb_search = jsonb_build_object('text_search', text_search);
UPDATE tsearch_to_tsvector SET text_search_domain = to_tsvector('simple', text_search);
UPDATE tsearch_to_tsvector SET text_search_rec_domain = to_tsvector('simple', text_search);

TRUNCATE TABLE artists CASCADE;
INSERT INTO artists
VALUES (1, 'duster'), (2, 'black country, new road'), (3, 'bjork');

TRUNCATE TABLE albums CASCADE;
INSERT INTO albums
VALUES (1, 'stratosphere', 1),
       (2, 'ants from up above',2),
       (3, 'vespertine',3),
       (4, 'contemporary movement', 1);

TRUNCATE TABLE places CASCADE;
INSERT INTO places (name)
VALUES ('Lake'), ('Mountain'), ('Beach');

TRUNCATE TABLE visits CASCADE;
INSERT INTO visits (place_id, start_time, end_time, visit_type)
VALUES (1, '2025-01-01 10:00','2025-01-01 11:00', 'vacation'),
       (1, '2025-01-01 15:00','2025-01-01 16:00', 'vacation'),
       (1, '2025-01-01 20:00', '2025-01-01 21:00', 'work'),
       (2, '2024-11-01 09:00','2024-11-01 10:00', 'vacation'),
       (3, '2024-12-02 13:00','2024-12-02 14:00', 'vacation'),
       (1, '2023-01-02 20:00','2023-01-01 21:00', 'work');

INSERT INTO bets (id) SELECT generate_series(1,1000);
