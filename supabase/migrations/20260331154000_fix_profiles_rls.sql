-- Fix profiles RLS policies - remove duplicate and fix recursion

-- Drop the duplicate policy
DROP POLICY IF EXISTS "Admins can manage coupons" ON profiles;

-- Fix profiles view policy to avoid recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
