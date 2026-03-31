CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MUGA Books Register - Loans and Copies

ALTER TABLE records
ADD COLUMN IF NOT EXISTS total_ejemplares INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS disponibles INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,

    borrower_type VARCHAR(20) NOT NULL CHECK (borrower_type IN ('student', 'teacher')),
    borrower_name VARCHAR(255) NOT NULL,
    borrower_course VARCHAR(10),
    borrower_division VARCHAR(5),
    borrower_department VARCHAR(100),

    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,

    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),

    notes TEXT,
    created_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_name ON loans(borrower_name);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_course ON loans(borrower_course);
CREATE INDEX IF NOT EXISTS idx_loans_record ON loans(record_id);
CREATE INDEX IF NOT EXISTS idx_loans_database ON loans(database_id);

CREATE OR REPLACE FUNCTION update_record_copies_on_loan_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
        UPDATE records
        SET disponibles = disponibles + 1
        WHERE id = NEW.record_id;
    ELSIF NEW.status = 'active' AND OLD.status = 'returned' THEN
        UPDATE records
        SET disponibles = disponibles - 1
        WHERE id = NEW.record_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_record_copies ON loans;
CREATE TRIGGER trigger_update_record_copies
    AFTER UPDATE OF status ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_record_copies_on_loan_status();

CREATE OR REPLACE FUNCTION set_overdue_loans_status()
RETURNS VOID AS $$
BEGIN
    UPDATE loans
    SET status = 'overdue'
    WHERE status = 'active'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on loans" ON loans;
CREATE POLICY "Allow all on loans"
ON loans FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS loan_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO loan_config (key, value, description) VALUES
    ('loan_days', '7', 'Loan duration days'),
    ('student_limit', '5', 'Loan limit for students'),
    ('teacher_limit', '0', 'Loan limit for teachers (0 = unlimited)')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE loan_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on loan_config" ON loan_config;
CREATE POLICY "Allow all on loan_config" ON loan_config FOR ALL USING (true);

DROP VIEW IF EXISTS v_records_ordered;

CREATE VIEW v_records_ordered AS
SELECT
    r.id,
    d.name AS catalog,
    r.database_id,
    r.mfn,
    r.data->>'title' AS title,
    r.data->>'author' AS author,
    r.data->>'year' AS year,
    r.data->>'publisher' AS publisher,
    r.data->>'isbn' AS isbn,
    r.data->>'edition' AS edition,
    r.data->>'place' AS place,
    r.data->>'pages' AS pages,
    r.data->>'cdu' AS cdu,
    r.data->>'subject' AS subject,
    r.data->>'description' AS description,
    r.data->>'barcode' AS barcode,
    r.total_ejemplares,
    r.disponibles,
    r.created_at,
    r.updated_at
FROM records r
LEFT JOIN databases d ON r.database_id = d.id
ORDER BY r.created_at DESC;

ALTER VIEW v_records_ordered OWNER TO postgres;
