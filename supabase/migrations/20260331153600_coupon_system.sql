-- Migration 009b: Coupon System - Fixed for existing tables
-- This handles the case where tables might already exist

-- =====================================================
-- TABLE: profiles (user profiles linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    library_name VARCHAR(255),
    library_description TEXT,
    library_slug VARCHAR(255),
    coupon_id UUID,
    max_catalogs INTEGER DEFAULT 2,
    catalogs_created INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'librarian',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint only if column exists and is unique
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'library_slug') THEN
        ALTER TABLE profiles ADD CONSTRAINT unique_library_slug UNIQUE (library_slug);
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN
    NULL;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_library_slug ON profiles(library_slug);

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

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- =====================================================
-- TABLE: coupon_requests (requests for coupons)
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    library_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_coupon_requests_status ON coupon_requests(status);

-- =====================================================
-- MODIFY: databases table - add owner and visibility
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'databases' AND column_name = 'owner_id') THEN
        ALTER TABLE databases ADD COLUMN owner_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'databases' AND column_name = 'is_public') THEN
        ALTER TABLE databases ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'databases' AND column_name = 'catalog_type') THEN
        ALTER TABLE databases ADD COLUMN catalog_type VARCHAR(50) DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'databases' AND column_name = 'library_visibility') THEN
        ALTER TABLE databases ADD COLUMN library_visibility VARCHAR(20) DEFAULT 'private';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_databases_owner ON databases(owner_id);

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
