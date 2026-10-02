-- drop unused functions
-- this is a fix for functions that had the wrong signature in 0052

DROP FUNCTION IF EXISTS storage.delete_leaf_prefixes(text[],text[]);

DROP FUNCTION IF EXISTS storage.get_level(text);

DROP FUNCTION IF EXISTS storage.get_prefixes(text);

DROP FUNCTION IF EXISTS storage.get_prefix(text);

DROP FUNCTION IF EXISTS storage.search_legacy_v1(text,text,int,int,int,text,text,text);