-- Add workflow states for loan requests and approvals

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.loans'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.loans DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.loans
  ADD CONSTRAINT loans_status_check
  CHECK (status IN ('requested', 'active', 'returned', 'rejected', 'overdue'));

CREATE INDEX IF NOT EXISTS idx_loans_status_created_at ON public.loans(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loans_created_by_record_status ON public.loans(created_by, record_id, status);

CREATE OR REPLACE FUNCTION update_record_copies_on_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('active', 'overdue') AND NEW.status IN ('active', 'overdue') THEN
    UPDATE public.records
    SET disponibles = GREATEST(0, COALESCE(disponibles, 0) - 1)
    WHERE id = NEW.record_id;
  ELSIF OLD.status IN ('active', 'overdue') AND NEW.status NOT IN ('active', 'overdue') THEN
    UPDATE public.records
    SET disponibles = COALESCE(disponibles, 0) + 1
    WHERE id = NEW.record_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_record_copies ON public.loans;
CREATE TRIGGER trigger_update_record_copies
  AFTER UPDATE OF status ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION update_record_copies_on_loan_status();
