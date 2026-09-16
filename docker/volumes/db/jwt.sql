\set jwt_exp `echo "$JWT_EXP"`
\set pgdb `echo "$POSTGRES_DB"`

ALTER DATABASE :"pgdb" SET "app.settings.jwt_exp" TO :'jwt_exp';
