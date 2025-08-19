-- Create activation codes table
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create index for faster lookups
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_activation_codes_is_used ON activation_codes(is_used);

-- Insert some sample activation codes
INSERT INTO activation_codes (code) VALUES 
  ('DEF9977'),
  ('ABC1234'),
  ('XYZ5678'),
  ('PET2024'),
  ('NFC0001'),
  ('DOG1234'),
  ('CAT5678'),
  ('FISH999'),
  ('BIRD777'),
  ('HAMSTER1');

-- RLS policies for activation codes
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read unused codes (for verification)
CREATE POLICY "Anyone can read unused codes" ON activation_codes
  FOR SELECT USING (is_used = FALSE);

-- Allow authenticated users to update codes when using them
CREATE POLICY "Users can use codes" ON activation_codes
  FOR UPDATE USING (auth.role() = 'authenticated');
