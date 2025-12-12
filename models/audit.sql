----------------------------------------------------------
-- VAULT ITEMS (CLIENT-SIDE AES-256-GCM)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    title BYTEA NOT NULL,
    login BYTEA,
    password BYTEA NOT NULL,
    notes BYTEA,

    iv BYTEA NOT NULL,
    tag BYTEA NOT NULL,

    icon TEXT DEFAULT 'lock',

    created_at TIMESTAMP DEFAULT NOW()
);

----------------------------------------------------------
-- INDEXES
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS vault_user_idx
    ON vault_items(user_id);

CREATE INDEX IF NOT EXISTS vault_created_idx
    ON vault_items(created_at DESC);

-- FUTURE SEARCH OPTIMIZATION (OPTIONAL)
CREATE INDEX IF NOT EXISTS vault_title_idx
    ON vault_items(title);

----------------------------------------------------------
-- GCM INTEGRITY
----------------------------------------------------------
ALTER TABLE vault_items
ADD CONSTRAINT gcm_check CHECK (
    octet_length(iv) = 12 AND
    octet_length(tag) = 16
);
