\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp `echo "$JWT_EXP"`
\set db_name `echo "$POSTGRES_DB"`

ALTER DATABASE :db_name SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER DATABASE :db_name SET "app.settings.jwt_exp" TO :'jwt_exp';
