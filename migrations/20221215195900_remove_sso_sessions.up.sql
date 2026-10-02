-- sso_sessions is not used as all of the necessary data is in sessions
drop table if exists {{ index .Options "Namespace" }}.sso_sessions;

