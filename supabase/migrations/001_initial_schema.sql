-- MUGA Books Register - Initial Database Schema
-- Sistema de Gestión Bibliotecaria basado en J-ISIS UNESCO

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BASES DE DATOS ISIS
-- ============================================

CREATE TABLE IF NOT EXISTS databases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DEFINICIONES DE CAMPOS (FDT - Field Definition Table)
-- ============================================

CREATE TABLE IF NOT EXISTS field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    tag VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, number, date, select, subfield
    is_repeatable BOOLEAN DEFAULT false,
    is_subfield BOOLEAN DEFAULT false,
    parent_tag VARCHAR(10),
    required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint for tag within database
CREATE UNIQUE INDEX idx_field_definitions_tag_db 
ON field_definitions(database_id, tag);

-- ============================================
-- REGISTROS BIBLIOGRÁFICOS
-- ============================================

CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    mfn SERIAL, -- Master File Number (ISIS compatible)
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for full-text search
CREATE INDEX idx_records_data_fts ON records USING GIN(data);

-- Index for database lookups
CREATE INDEX idx_records_database ON records(database_id);

-- ============================================
-- HISTORIAL DE REGISTROS (Versionado)
-- ============================================

CREATE TABLE IF NOT EXISTS record_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    changed_by VARCHAR(255),
    change_type VARCHAR(50) NOT NULL, -- create, update, delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLASIFICACIÓN DECIMAL UNIVERSAL (CDU)
-- ============================================

CREATE TABLE IF NOT EXISTS cdu_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    parent_code VARCHAR(10),
    description TEXT,
    examples JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint for code
CREATE UNIQUE INDEX idx_cdu_code ON cdu_classes(code);

-- ============================================
-- PLANTILLAS DE IMPORTACIÓN/EXPORTACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    format VARCHAR(50) NOT NULL,
    filters JSONB,
    total_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ÍNDICES DE BÚSQUEDA
-- ============================================

CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GIN index for full-text search
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Triggers para updated_at
CREATE TRIGGER update_databases_updated_at
    BEFORE UPDATE ON databases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DATOS INICIALES - CDU (10 clases principales)
-- ============================================

INSERT INTO cdu_classes (code, title, description) VALUES
('0', 'Obras Generales', 'Bibliografías, enciclopedias, diccionarios, publicaciones periódicas'),
('1', 'Filosofía', 'Lógica, metafísica, ética, psicología'),
('2', 'Religión', 'Teología, Biblia, mitología, religions'),
('3', 'Ciencias Sociales', 'Sociología, educación, derecho, política'),
('4', 'Lenguaje', 'Lingüística, gramática, diccionarios'),
('5', 'Ciencias Puras', 'Matemáticas, física, química, biología'),
('6', 'Ciencias Aplicadas', 'Medicina, ingeniería, agricultura, industria'),
('7', 'Arte y Literatura', 'Arquitectura, música, literatura, cine'),
('8', 'Historia y Geografía', 'Historia universal, biografía'),
('9', 'Geografía y Viajes', 'Geografía, mapas, atlas, viajes')
ON CONFLICT (code) DO NOTHING;

-- Subdivisiones comunes de Ciencias Puras (5)
INSERT INTO cdu_classes (code, title, parent_code) VALUES
('51', 'Matemáticas', '5'),
('52', 'Astronomía', '5'),
('53', 'Física', '5'),
('54', 'Química', '5'),
('55', 'Geología', '5'),
('56', 'Paleontología', '5'),
('57', 'Biología', '5'),
('58', 'Botánica', '5'),
('59', 'Zoología', '5')
ON CONFLICT (code) DO NOTHING;

-- Subdivisiones de Ciencias Aplicadas (6)
INSERT INTO cdu_classes (code, title, parent_code) VALUES
('61', 'Medicina', '6'),
('62', 'Ingeniería', '6'),
('63', 'Agricultura', '6'),
('64', 'Economía Doméstica', '6'),
('65', 'Gestión Empresarial', '6'),
('66', 'Química Industrial', '6'),
('67', 'Industrias', '6'),
('68', 'Manufacturas', '6'),
('69', 'Construcción', '6')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

ALTER TABLE databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdu_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para CDU (lectura)
CREATE POLICY "Allow public read access on cdu_classes" 
ON cdu_classes FOR SELECT USING (true);

-- Políticas para otras tablas (por ahora allow all para desarrollo)
CREATE POLICY "Allow all on databases" 
ON databases FOR ALL USING (true);

CREATE POLICY "Allow all on field_definitions" 
ON field_definitions FOR ALL USING (true);

CREATE POLICY "Allow all on records" 
ON records FOR ALL USING (true);

CREATE POLICY "Allow all on record_versions" 
ON record_versions FOR ALL USING (true);

CREATE POLICY "Allow all on import_jobs" 
ON import_jobs FOR ALL USING (true);

CREATE POLICY "Allow all on export_jobs" 
ON export_jobs FOR ALL USING (true);

CREATE POLICY "Allow all on search_index" 
ON search_index FOR ALL USING (true);
