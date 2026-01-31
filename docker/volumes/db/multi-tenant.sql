\set pguser `echo "$POSTGRES_USER"`

\c _supabase

-- Create multi-tenant schema
CREATE SCHEMA IF NOT EXISTS _multi_tenant;
ALTER SCHEMA _multi_tenant OWNER TO :pguser;

-- Organizations table
CREATE TABLE IF NOT EXISTS _multi_tenant.organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS _multi_tenant.projects (
    id SERIAL PRIMARY KEY,
    ref VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization_id INTEGER NOT NULL REFERENCES _multi_tenant.organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ACTIVE_HEALTHY',
    region VARCHAR(50) DEFAULT 'local',
    cloud_provider VARCHAR(50) DEFAULT 'localhost',
    db_host VARCHAR(255) DEFAULT 'db',
    db_port INTEGER DEFAULT 5432,
    db_name VARCHAR(255),
    db_schema VARCHAR(255) DEFAULT 'public',
    pooler_tenant_id VARCHAR(255),
    storage_tenant_id VARCHAR(255),
    jwt_secret TEXT,
    anon_key TEXT,
    service_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON _multi_tenant.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_ref ON _multi_tenant.projects(ref);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION _multi_tenant.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON _multi_tenant.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON _multi_tenant.organizations
    FOR EACH ROW
    EXECUTE FUNCTION _multi_tenant.update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON _multi_tenant.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON _multi_tenant.projects
    FOR EACH ROW
    EXECUTE FUNCTION _multi_tenant.update_updated_at();

-- Insert default organization if not exists
INSERT INTO _multi_tenant.organizations (id, name, slug)
VALUES (1, 'Default Organization', 'default')
ON CONFLICT (id) DO NOTHING;

-- Insert default project if not exists
INSERT INTO _multi_tenant.projects (id, ref, name, organization_id, db_name, pooler_tenant_id, storage_tenant_id)
VALUES (1, 'default', 'Default Project', 1, 'postgres', 'default', 'default')
ON CONFLICT (id) DO NOTHING;

\c postgres
