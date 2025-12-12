CREATE TABLE IF NOT EXISTS vault_items(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title BYTEA NOT NULL,
    login BYTEA,
    password BYTEA NOT NULL,
    notes BYTEA,

    iv BYTEA NOT NULL,
    tag BYTEA NOT NULL,

    icon TEXT DEFAULT 'lock',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX vault_user_idx ON vault_items(user_id);

ALTER TABLE vault_items ADD CONSTRAINT gcm_check CHECK (
    octet_length(iv)=12 AND
    octet_length(tag)=16
);
