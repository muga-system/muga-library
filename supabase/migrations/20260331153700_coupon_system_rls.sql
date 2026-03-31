-- Migration 010b: RLS Policies for Coupon System - Fixed
-- This migration sets up Row Level Security policies safely

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
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- COUPONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can validate coupons" ON coupons;
CREATE POLICY "Anyone can validate coupons" ON coupons
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL USING (true);

-- =====================================================
-- COUPON REQUESTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can create coupon request" ON coupon_requests;
CREATE POLICY "Anyone can create coupon request" ON coupon_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own coupon request" ON coupon_requests;
CREATE POLICY "Users can view own coupon request" ON coupon_requests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can view all coupon requests" ON coupon_requests;
CREATE POLICY "Admins can view all coupon requests" ON coupon_requests
    FOR ALL USING (true);

-- =====================================================
-- DATABASES POLICIES (Updated)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own databases" ON databases;
CREATE POLICY "Users can view own databases" ON databases
    FOR SELECT USING (
        owner_id = auth.uid()
        OR is_public = true
        OR library_visibility = 'public'
        OR owner_id IS NULL
    );

DROP POLICY IF EXISTS "Users can create databases" ON databases;
CREATE POLICY "Users can create databases" ON databases
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update own databases" ON databases;
CREATE POLICY "Users can update own databases" ON databases
    FOR UPDATE USING (
        owner_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can delete own databases" ON databases;
CREATE POLICY "Users can delete own databases" ON databases
    FOR DELETE USING (
        owner_id = auth.uid()
    );

-- =====================================================
-- RECORDS POLICIES (Updated - join through databases)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own records" ON records;
CREATE POLICY "Users can view own records" ON records
    FOR SELECT USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
            OR is_public = true
            OR library_visibility = 'public'
            OR owner_id IS NULL
        )
    );

DROP POLICY IF EXISTS "Users can create records" ON records;
CREATE POLICY "Users can create records" ON records
    FOR INSERT WITH CHECK (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own records" ON records;
CREATE POLICY "Users can update own records" ON records
    FOR UPDATE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own records" ON records;
CREATE POLICY "Users can delete own records" ON records
    FOR DELETE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- LOANS POLICIES (Updated)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
CREATE POLICY "Users can view own loans" ON loans
    FOR SELECT USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
            OR owner_id IS NULL
        )
    );

DROP POLICY IF EXISTS "Users can create loans" ON loans;
CREATE POLICY "Users can create loans" ON loans
    FOR INSERT WITH CHECK (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update loans" ON loans;
CREATE POLICY "Users can update loans" ON loans
    FOR UPDATE USING (
        database_id IN (
            SELECT id FROM databases 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- =====================================================
GRANT ALL ON profiles TO service_role;
GRANT ALL ON coupons TO service_role;
GRANT ALL ON coupon_requests TO service_role;
GRANT ALL ON databases TO service_role;
GRANT ALL ON records TO service_role;
GRANT ALL ON loans TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
