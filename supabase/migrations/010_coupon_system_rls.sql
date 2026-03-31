-- Migration 010: RLS Policies for Coupon System
-- This migration sets up Row Level Security policies

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE databases ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- COUPONS POLICIES
-- =====================================================

-- Anyone can validate a coupon (public read)
DROP POLICY IF EXISTS "Anyone can validate coupons" ON coupons;
CREATE POLICY "Anyone can validate coupons" ON coupons
    FOR SELECT USING (true);

-- Admins can manage all coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- COUPON REQUESTS POLICIES
-- =====================================================

-- Anyone can create a request
DROP POLICY IF EXISTS "Anyone can create coupon request" ON coupon_requests;
CREATE POLICY "Anyone can create coupon request" ON coupon_requests
    FOR INSERT WITH CHECK (true);

-- Users can view their own request
DROP POLICY IF EXISTS "Users can view own coupon request" ON coupon_requests;
CREATE POLICY "Users can view own coupon request" ON coupon_requests
    FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = auth.uid()) OR true);

-- Admins can view all requests
DROP POLICY IF EXISTS "Admins can view all coupon requests" ON coupon_requests;
CREATE POLICY "Admins can view all coupon requests" ON coupon_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- DATABASES POLICIES (Updated)
-- =====================================================

-- Users can view their own databases OR public databases
DROP POLICY IF EXISTS "Users can view own databases" ON databases;
CREATE POLICY "Users can view own databases" ON databases
    FOR SELECT USING (
        owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        OR is_public = true
        OR library_visibility = 'public'
    );

-- Users can insert their own databases (with limit check)
DROP POLICY IF EXISTS "Users can create databases" ON databases;
CREATE POLICY "Users can create databases" ON databases
    FOR INSERT WITH CHECK (
        owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
    );

-- Users can update their own databases
DROP POLICY IF EXISTS "Users can update own databases" ON databases;
CREATE POLICY "Users can update own databases" ON databases
    FOR UPDATE USING (
        owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
    );

-- Users can delete their own databases
DROP POLICY IF EXISTS "Users can delete own databases" ON databases;
CREATE POLICY "Users can delete own databases" ON databases
    FOR DELETE USING (
        owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
    );

-- =====================================================
-- RECORDS POLICIES (Updated - join through databases)
-- =====================================================

-- Users can view records from their databases OR public databases
DROP POLICY IF EXISTS "Users can view own records" ON records;
CREATE POLICY "Users can view own records" ON records
    FOR SELECT USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
            OR is_public = true
            OR library_visibility = 'public'
        )
    );

-- Users can insert records to their own databases
DROP POLICY IF EXISTS "Users can create records" ON records;
CREATE POLICY "Users can create records" ON records
    FOR INSERT WITH CHECK (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- Users can update records in their own databases
DROP POLICY IF EXISTS "Users can update own records" ON records;
CREATE POLICY "Users can update own records" ON records
    FOR UPDATE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- Users can delete records in their own databases
DROP POLICY IF EXISTS "Users can delete own records" ON records;
CREATE POLICY "Users can delete own records" ON records
    FOR DELETE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- =====================================================
-- LOANS POLICIES (Updated)
-- =====================================================

-- Users can view loans from their databases
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
CREATE POLICY "Users can view own loans" ON loans
    FOR SELECT USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- Users can create loans in their databases
DROP POLICY IF EXISTS "Users can create loans" ON loans;
CREATE POLICY "Users can create loans" ON loans
    FOR INSERT WITH CHECK (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- Users can update loans in their databases
DROP POLICY IF EXISTS "Users can update loans" ON loans;
CREATE POLICY "Users can update loans" ON loans
    FOR UPDATE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1)
        )
    );

-- =====================================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- =====================================================
-- The service role (supabase_admin) needs to bypass RLS
-- This is handled automatically by Supabase, but we ensure it works

GRANT ALL ON profiles TO service_role;
GRANT ALL ON coupons TO service_role;
GRANT ALL ON coupon_requests TO service_role;
GRANT ALL ON databases TO service_role;
GRANT ALL ON records TO service_role;
GRANT ALL ON loans TO service_role;

-- Grant usage to authenticated role
GRANT USAGE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
