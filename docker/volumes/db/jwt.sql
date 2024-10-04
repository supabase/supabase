\set jwt_secret `echo "$JWT_SECRET"`
\set jwt_exp `echo "$JWT_EXP"`

ALTER ROLE postgres IN DATABASE postgres SET "app.settings.jwt_secret" TO :'jwt_secret';
ALTER ROLE postgres IN DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
