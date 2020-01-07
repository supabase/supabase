ALTER SYSTEM SET wal_level='logical';
ALTER SYSTEM SET max_wal_senders='11';
ALTER SYSTEM SET max_replication_slots='11';

-- This is now run in the latest dump
-- CREATE PUBLICATION supabase_realtime FOR ALL TABLES; 

CREATE ROLE web_admin;