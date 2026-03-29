CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS methodology_books (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  page_count INT,
  status VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_chunks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  book_id UUID REFERENCES methodology_books(id) ON DELETE CASCADE,
  book_title VARCHAR(255),
  page_number INT,
  chapter_title VARCHAR(255),
  content TEXT NOT NULL,
  embedding vector(1536)
);

CREATE TABLE IF NOT EXISTS scientific_articles (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  authors TEXT NOT NULL,
  year INT,
  abstract TEXT,
  methodology TEXT,
  main_results TEXT,
  conclusions TEXT,
  missing_fields JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_components (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  general_problem TEXT,
  specific_problems JSONB,
  general_objective TEXT,
  specific_objectives JSONB,
  suggested_instruments JSONB,
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS session_states (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  conversation_history JSONB,
  current_phase VARCHAR(50),
  components JSONB,
  state_of_art JSONB,
  final_document JSONB,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS final_documents (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  introduction TEXT,
  research_problematic TEXT,
  research_problem TEXT,
  general_objective TEXT,
  specific_objectives TEXT,
  state_of_art JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
