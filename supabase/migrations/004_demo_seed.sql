-- Demo seed for customer presentation
-- Run only in demo/staging environments

INSERT INTO databases (id, name, description)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Catalogo General', 'Coleccion principal de la biblioteca escolar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO records (id, database_id, data, total_ejemplares, disponibles)
VALUES
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    '{"title":"Rayuela","author":"Julio Cortazar","year":"1963","publisher":"Sudamericana","isbn":"9789500700399","cdu":"821.134.2-31","subject":"Literatura argentina"}'::jsonb,
    3,
    2
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    '{"title":"El Aleph","author":"Jorge Luis Borges","year":"1949","publisher":"Losada","isbn":"9789500395588","cdu":"821.134.2-32","subject":"Cuento"}'::jsonb,
    2,
    2
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, database_id, record_id, prestatario_tipo, prestatario_nombre, prestatario_curso, prestatario_division, fecha_prestamo, fecha_vencimiento, estado)
VALUES
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101',
    'alumno',
    'Lucia Gomez',
    '5',
    'A',
    CURRENT_DATE - INTERVAL '2 day',
    CURRENT_DATE + INTERVAL '5 day',
    'activo'
  )
ON CONFLICT (id) DO NOTHING;