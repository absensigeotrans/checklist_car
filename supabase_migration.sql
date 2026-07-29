-- ====================================================================
-- SUPABASE MIGRATION SCRIPT FOR PTK DIGITAL CHECKLIST SYSTEM
-- ====================================================================
-- Silakan salin dan jalankan seluruh query SQL di bawah ini di dalam
-- menu "SQL Editor" pada Dashboard Supabase Anda.
-- Script ini bersifat idempotensial (dapat dijalankan berulang kali dengan aman).
-- ====================================================================

-- 1. TABEL: inspections (Checklist Kondisi Kendaraan)
CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    inspection_date TIMESTAMP WITH TIME ZONE,
    driver_name TEXT,
    driver_nik TEXT,
    vehicle_type TEXT,
    license_plate TEXT,
    mileage_start NUMERIC DEFAULT 0,
    mileage_end NUMERIC DEFAULT 0,
    fuel_level NUMERIC DEFAULT 50,
    notes JSONB DEFAULT '["", "", ""]'::jsonb,
    checklist JSONB DEFAULT '{}'::jsonb,
    damages JSONB DEFAULT '[]'::jsonb,
    signature TEXT,
    attention_needed BOOLEAN DEFAULT false
);

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_nik TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mileage_start NUMERIC DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mileage_end NUMERIC DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fuel_level NUMERIC DEFAULT 50;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '["", "", ""]'::jsonb;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '{}'::jsonb;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS damages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS attention_needed BOOLEAN DEFAULT false;

-- 2. TABEL: driver_logs (Log Sheet Driver Harian / 30-Day Log)
CREATE TABLE IF NOT EXISTS driver_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    driver_name TEXT,
    driver_nik TEXT,
    license_plate TEXT,
    log_date TEXT,
    log_day TEXT,
    work_start TEXT,
    work_end TEXT,
    km_start NUMERIC DEFAULT 0,
    km_end NUMERIC DEFAULT 0,
    user_name TEXT,
    user_signature TEXT,
    remark TEXT
);

ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS driver_nik TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS log_date TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS log_day TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS work_start TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS work_end TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS km_start NUMERIC DEFAULT 0;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS km_end NUMERIC DEFAULT 0;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS user_signature TEXT;
ALTER TABLE driver_logs ADD COLUMN IF NOT EXISTS remark TEXT;

-- 3. INDEKS PERFORMA
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections (inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_driver_nik ON inspections (driver_nik);
CREATE INDEX IF NOT EXISTS idx_inspections_license_plate ON inspections (license_plate);

CREATE INDEX IF NOT EXISTS idx_driver_logs_date ON driver_logs (log_date DESC);
CREATE INDEX IF NOT EXISTS idx_driver_logs_driver_nik ON driver_logs (driver_nik);
CREATE INDEX IF NOT EXISTS idx_driver_logs_license_plate ON driver_logs (license_plate);

-- 4. ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select inspections" ON inspections;
DROP POLICY IF EXISTS "Allow public insert inspections" ON inspections;
DROP POLICY IF EXISTS "Allow public update inspections" ON inspections;
DROP POLICY IF EXISTS "Allow public delete inspections" ON inspections;

CREATE POLICY "Allow public select inspections" ON inspections FOR SELECT USING (true);
CREATE POLICY "Allow public insert inspections" ON inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update inspections" ON inspections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete inspections" ON inspections FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select driver_logs" ON driver_logs;
DROP POLICY IF EXISTS "Allow public insert driver_logs" ON driver_logs;
DROP POLICY IF EXISTS "Allow public update driver_logs" ON driver_logs;
DROP POLICY IF EXISTS "Allow public delete driver_logs" ON driver_logs;

CREATE POLICY "Allow public select driver_logs" ON driver_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert driver_logs" ON driver_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update driver_logs" ON driver_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete driver_logs" ON driver_logs FOR DELETE USING (true);
