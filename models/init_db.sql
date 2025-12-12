-- =====================================================
-- INIT DB RESET: Users, Vault, Audit
-- Supprime et recrée toutes les tables et types
-- =====================================================

-- Supprimer les contraintes, tables et types si existants
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS vault_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role;

-- Extension pour UUID et crypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TYPE user_role AS ENUM ('user','team_admin','admin');

CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_email_idx ON users(email);

-- =====================================================
-- VAULT ITEMS TABLE
-- =====================================================
CREATE TABLE vault_items(
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

ALTER TABLE vault_items
    ADD CONSTRAINT gcm_check CHECK (
        octet_length(iv) = 12 AND
        octet_length(tag) = 16
    );

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX audit_user_idx ON audit_logs(user_id);

-- =====================================================
-- FIN
-- =====================================================
