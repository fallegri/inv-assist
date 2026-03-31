CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Perfiles de usuario (Modificado para usar Auth Nativo en PostgreSQL)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  institucion VARCHAR(255) NOT NULL,
  carrera VARCHAR(255) NOT NULL,
  area_estudio VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Proyectos y máquina de estados
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  titulo_tentativo TEXT,
  carga_horaria_confirmada BOOLEAN DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'init', -- init, diagnosis, objectives, literature, methodology, complete
  is_exploratory_exception BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Evidencias (Fase Diagnóstico)
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tipo_evidencia VARCHAR(50) NOT NULL, -- 'file', 'text', 'interview'
  contenido_raw TEXT,
  file_path TEXT,
  ai_extracted_problems JSONB,
  problema_central TEXT,
  problema_confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Objetivos y conectividad con Bloom
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'general', 'specific'
  verbo VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  variables JSONB,
  bloom_validado BOOLEAN DEFAULT false,
  requiere_revision BOOLEAN DEFAULT false,
  orden INT DEFAULT 1,
  UNIQUE(project_id, tipo) DEFERRABLE INITIALLY DEFERRED -- Un proyecto solo puede tener un objetivo general activo a la vez
);

-- 5. Estado del Arte (Literatura)
CREATE TABLE IF NOT EXISTS literature_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  anio INT,
  pais VARCHAR(100),
  autor VARCHAR(255) NOT NULL,
  titulo TEXT NOT NULL,
  aportaciones TEXT,
  vacios TEXT,
  diferencias TEXT,
  similitudes TEXT,
  metodologia_referencia TEXT,
  url_pdf TEXT,
  source VARCHAR(50) DEFAULT 'manual'
);

-- 6. Metodología
CREATE TABLE IF NOT EXISTS methodology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  enfoque VARCHAR(50), -- qualitative, quantitative, mixed
  alcance VARCHAR(50),
  poblacion_size INT,
  muestra_size INT,
  nivel_confianza NUMERIC DEFAULT 95.0,
  margen_error NUMERIC DEFAULT 5.0,
  instrumentos JSONB,
  marco_teorico_indice JSONB
);

-- 7. Alertas de consistencia de la Máquina de Estados
CREATE TABLE IF NOT EXISTS consistency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  resuelta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
