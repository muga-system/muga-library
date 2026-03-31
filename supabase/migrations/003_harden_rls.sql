-- Harden RLS policies for demo and production-like environments

-- Drop permissive policies from initial migrations
DROP POLICY IF EXISTS "Allow all on databases" ON databases;
DROP POLICY IF EXISTS "Allow all on field_definitions" ON field_definitions;
DROP POLICY IF EXISTS "Allow all on records" ON records;
DROP POLICY IF EXISTS "Allow all on record_versions" ON record_versions;
DROP POLICY IF EXISTS "Allow all on import_jobs" ON import_jobs;
DROP POLICY IF EXISTS "Allow all on export_jobs" ON export_jobs;
DROP POLICY IF EXISTS "Allow all on search_index" ON search_index;
DROP POLICY IF EXISTS "Allow all on loans" ON loans;
DROP POLICY IF EXISTS "Allow all on loan_config" ON loan_config;

-- Keep CDU readable, but restrict write operations to authenticated users
DROP POLICY IF EXISTS "Allow public read access on cdu_classes" ON cdu_classes;
CREATE POLICY "Public read access on cdu_classes"
ON cdu_classes FOR SELECT
USING (true);

CREATE POLICY "Authenticated write access on cdu_classes"
ON cdu_classes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Restrict all application tables to authenticated users
CREATE POLICY "Authenticated access on databases"
ON databases FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on field_definitions"
ON field_definitions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on records"
ON records FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on record_versions"
ON record_versions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on import_jobs"
ON import_jobs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on export_jobs"
ON export_jobs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on search_index"
ON search_index FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on loans"
ON loans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated access on loan_config"
ON loan_config FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);