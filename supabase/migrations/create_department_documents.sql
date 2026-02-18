-- Department Documents table for storing uploaded files and extracted text
CREATE TABLE IF NOT EXISTS department_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(20) NOT NULL,
    file_name TEXT,
    file_url TEXT,
    file_type VARCHAR(50),
    file_size BIGINT,
    extracted_text TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast department lookups
CREATE INDEX IF NOT EXISTS idx_dept_docs_code ON department_documents(department_code);

-- Enable RLS
ALTER TABLE department_documents ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Allow public read" ON department_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON department_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON department_documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON department_documents FOR DELETE USING (true);
