-- Local development project URL for util.project_url()
select vault.create_secret('http://api.supabase.internal:8000', 'project_url');
