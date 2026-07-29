-- Migration: Create registered_drivers table for cross-device driver account sync
-- This stores driver registrations in Supabase so admin can see all registered
-- drivers from any device, and driver login validation works across devices.

CREATE TABLE IF NOT EXISTS registered_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by NIK
CREATE INDEX IF NOT EXISTS idx_registered_drivers_nik ON registered_drivers(nik);

-- Enable Row Level Security
ALTER TABLE registered_drivers ENABLE ROW LEVEL SECURITY;

-- Policy: allow anyone to read (admin needs to see all drivers, driver login needs to check NIK)
CREATE POLICY "Allow read registered_drivers"
  ON registered_drivers FOR SELECT USING (true);

-- Policy: allow anyone to insert (driver registers from their own device)
CREATE POLICY "Allow insert registered_drivers"
  ON registered_drivers FOR INSERT WITH CHECK (true);

-- Policy: allow upsert/update (update name if NIK already exists)
CREATE POLICY "Allow update registered_drivers"
  ON registered_drivers FOR UPDATE USING (true);

-- Policy: allow delete (admin can remove driver accounts)
CREATE POLICY "Allow delete registered_drivers"
  ON registered_drivers FOR DELETE USING (true);
