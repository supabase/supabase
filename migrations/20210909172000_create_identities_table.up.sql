-- adds identities table 

CREATE TABLE IF NOT EXISTS {{ index .Options "Namespace" }}.identities (
    id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data JSONB NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamptz NULL,
    created_at timestamptz NULL,
    updated_at timestamptz NULL,
    CONSTRAINT identities_pkey PRIMARY KEY (provider, id),
    CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES {{ index .Options "Namespace" }}.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE {{ index .Options "Namespace" }}.identities is 'Auth: Stores identities associated to a user.';
