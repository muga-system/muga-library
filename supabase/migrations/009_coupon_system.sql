-- Migration 009: Coupon System for User Authentication
-- This migration creates the coupon-based authentication system

-- =====================================================
-- TABLE: profiles (user profiles linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    library_name VARCHAR(255),
    library_description TEXT,
    library_slug VARCHAR(255) UNIQUE,
    coupon_id UUID,
    max_catalogs INTEGER DEFAULT 2,
    catalogs_created INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'librarian', -- 'admin' or 'librarian'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_library_slug ON profiles(library_slug);

-- =====================================================
-- TABLE: coupons (activation codes)
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    used_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES profiles(id),
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for coupon lookup
CREATE INDEX idx_coupons_code ON coupons(code);

-- =====================================================
-- TABLE: coupon_requests (requests for coupons)
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    library_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Index for admin queries
CREATE INDEX idx_coupon_requests_status ON coupon_requests(status);

-- =====================================================
-- MODIFY: databases table - add owner and visibility
-- =====================================================
ALTER TABLE databases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);
ALTER TABLE databases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE databases ADD COLUMN IF NOT EXISTS catalog_type VARCHAR(50) DEFAULT 'general'; -- 'general', 'school', 'public', 'specialized'
ALTER TABLE databases ADD COLUMN IF NOT EXISTS library_visibility VARCHAR(20) DEFAULT 'public'; -- 'public', 'private'

-- Index for owner queries
CREATE INDEX idx_databases_owner ON databases(owner_id);

-- =====================================================
-- MODIFY: records table - add owner reference (for RLS)
-- =====================================================
-- Note: records already have database_id, we can join through databases

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for databases
DROP TRIGGER IF EXISTS update_databases_updated_at ON databases;
CREATE TRIGGER update_databases_updated_at
    BEFORE UPDATE ON databases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNCTION: Check catalog limit
-- =====================================================
CREATE OR REPLACE FUNCTION check_catalog_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    IF profile_record IS NULL THEN
        RETURN FALSE;
    END IF;
    IF profile_record.catalogs_created >= profile_record.max_catalogs THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Check library limit
-- =====================================================
CREATE OR REPLACE FUNCTION check_library_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    IF profile_record IS NULL THEN
        RETURN FALSE;
    END IF;
    IF profile_record.library_name IS NOT NULL AND profile_record.library_name != '' THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Generate random password
-- =====================================================
CREATE OR REPLACE FUNCTION generate_random_password(length INTEGER DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Generate username from email
-- =====================================================
CREATE OR REPLACE FUNCTION generate_username(email TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    random_suffix TEXT;
    final_username TEXT;
    existing_count INTEGER;
BEGIN
    -- Extract part before @ from email
    base_username := split_part(email, '@', 1);
    -- Remove special characters
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g');
    -- Make it lowercase
    base_username := lower(base_username);
    -- Add random suffix
    random_suffix := floor(random() * 9000 + 1000)::TEXT;
    final_username := base_username || random_suffix;
    
    -- Check if username exists, retry if needed
    LOOP
        SELECT COUNT(*) INTO existing_count 
        FROM profiles 
        WHERE library_slug = final_username OR email LIKE '%' || final_username || '%';
        
        IF existing_count = 0 THEN
            EXIT;
        END IF;
        random_suffix := floor(random() * 9000 + 1000)::TEXT;
        final_username := base_username || random_suffix;
    END LOOP;
    
    RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT ADMIN PROFILE (run manually if needed)
-- =====================================================
-- This will be populated when the first admin user is created through the bootstrap API

COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE coupons IS 'Activation codes for new users';
COMMENT ON TABLE coupon_requests IS 'Requests for activation codes';
COMMENT ON COLUMN databases.owner_id IS 'Owner profile ID';
COMMENT ON COLUMN databases.is_public IS 'Whether catalog is visible in community';
