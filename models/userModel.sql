CREATE EXTENSION IF NOT EXISTS pgcrypto;

----------------------------------------------------------
-- ENUM USER ROLE
----------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM ('user','team_admin','admin');
    END IF;
END
$$;

----------------------------------------------------------
-- USERS TABLE
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role user_role DEFAULT 'user',

    created_at TIMESTAMP DEFAULT NOW()
);

----------------------------------------------------------
-- INDEXES
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS users_role_idx
    ON users(role);

CREATE INDEX IF NOT EXISTS users_email_idx
    ON users(email);

-- LOGIN INSENSITIVE (OPTIONNEL MAIS RECOMMANDÉ)
CREATE INDEX IF NOT EXISTS users_email_lower_idx
    ON users(LOWER(email));
