-- Normalize legacy Spanish loan schema/data to English naming

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'prestatario_tipo'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN prestatario_tipo TO borrower_type';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'prestatario_nombre'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN prestatario_nombre TO borrower_name';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'prestatario_curso'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN prestatario_curso TO borrower_course';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'prestatario_division'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN prestatario_division TO borrower_division';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'prestatario_departamento'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN prestatario_departamento TO borrower_department';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'fecha_prestamo'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN fecha_prestamo TO loan_date';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'fecha_vencimiento'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN fecha_vencimiento TO due_date';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'fecha_devolucion'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN fecha_devolucion TO return_date';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'estado'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN estado TO status';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'observaciones'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN observaciones TO notes';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'creado_por'
  ) THEN
    EXECUTE 'ALTER TABLE public.loans RENAME COLUMN creado_por TO created_by';
  END IF;
END $$;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.loans'::regclass
      AND contype = 'c'
      AND (
        pg_get_constraintdef(oid) ILIKE '%borrower_type%'
        OR pg_get_constraintdef(oid) ILIKE '%prestatario_tipo%'
        OR pg_get_constraintdef(oid) ILIKE '%status%'
        OR pg_get_constraintdef(oid) ILIKE '%estado%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.loans DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trigger_actualizar_ejemplares ON public.loans;
DROP TRIGGER IF EXISTS trigger_update_record_copies ON public.loans;
DROP FUNCTION IF EXISTS actualizar_ejemplares();

UPDATE public.loans
SET borrower_type = CASE borrower_type
  WHEN 'alumno' THEN 'student'
  WHEN 'profesor' THEN 'teacher'
  ELSE borrower_type
END
WHERE borrower_type IN ('alumno', 'profesor');

UPDATE public.loans
SET status = CASE status
  WHEN 'activo' THEN 'active'
  WHEN 'devuelto' THEN 'returned'
  WHEN 'atrasado' THEN 'overdue'
  ELSE status
END
WHERE status IN ('activo', 'devuelto', 'atrasado');

ALTER TABLE public.loans
  ALTER COLUMN borrower_type TYPE VARCHAR(20),
  ALTER COLUMN status TYPE VARCHAR(20),
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.loans
  ADD CONSTRAINT loans_borrower_type_check CHECK (borrower_type IN ('student', 'teacher')),
  ADD CONSTRAINT loans_status_check CHECK (status IN ('active', 'returned', 'overdue'));

DO $$
BEGIN
  IF to_regclass('public.idx_loans_estado') IS NOT NULL AND to_regclass('public.idx_loans_status') IS NULL THEN
    EXECUTE 'ALTER INDEX public.idx_loans_estado RENAME TO idx_loans_status';
  END IF;

  IF to_regclass('public.idx_prestamos_estado') IS NOT NULL AND to_regclass('public.idx_loans_status') IS NULL THEN
    EXECUTE 'ALTER INDEX public.idx_prestamos_estado RENAME TO idx_loans_status';
  END IF;

  IF to_regclass('public.idx_prestamos_fecha_vencimiento') IS NOT NULL AND to_regclass('public.idx_loans_due_date') IS NULL THEN
    EXECUTE 'ALTER INDEX public.idx_prestamos_fecha_vencimiento RENAME TO idx_loans_due_date';
  END IF;

  IF to_regclass('public.idx_prestamos_prestatario_nombre') IS NOT NULL AND to_regclass('public.idx_loans_borrower_name') IS NULL THEN
    EXECUTE 'ALTER INDEX public.idx_prestamos_prestatario_nombre RENAME TO idx_loans_borrower_name';
  END IF;

  IF to_regclass('public.idx_prestamos_prestatario_curso') IS NOT NULL AND to_regclass('public.idx_loans_borrower_course') IS NULL THEN
    EXECUTE 'ALTER INDEX public.idx_prestamos_prestatario_curso RENAME TO idx_loans_borrower_course';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans(due_date);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_name ON public.loans(borrower_name);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_course ON public.loans(borrower_course);

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

DROP TRIGGER IF EXISTS trigger_actualizar_ejemplares ON public.loans;
DROP TRIGGER IF EXISTS trigger_update_record_copies ON public.loans;
CREATE TRIGGER trigger_update_record_copies
    AFTER UPDATE OF status ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION update_record_copies_on_loan_status();

CREATE OR REPLACE FUNCTION set_overdue_loans_status()
RETURNS VOID AS $$
BEGIN
    UPDATE public.loans
    SET status = 'overdue'
    WHERE status = 'active'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loan_config' AND column_name = 'clave'
  ) THEN
    EXECUTE 'ALTER TABLE public.loan_config RENAME COLUMN clave TO "key"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loan_config' AND column_name = 'valor'
  ) THEN
    EXECUTE 'ALTER TABLE public.loan_config RENAME COLUMN valor TO "value"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loan_config' AND column_name = 'descripcion'
  ) THEN
    EXECUTE 'ALTER TABLE public.loan_config RENAME COLUMN descripcion TO description';
  END IF;
END $$;

UPDATE public.loan_config
SET "key" = CASE "key"
  WHEN 'dias_prestamo' THEN 'loan_days'
  WHEN 'limite_alumnos' THEN 'student_limit'
  WHEN 'limite_profesores' THEN 'teacher_limit'
  ELSE "key"
END
WHERE "key" IN ('dias_prestamo', 'limite_alumnos', 'limite_profesores');

